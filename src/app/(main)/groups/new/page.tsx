'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Institution {
  id: string;
  name: string;
  logo: string | null;
  colleges: {
    id: string;
    name: string;
    departments: {
      id: string;
      name: string;
    }[];
  }[];
}

export default function NewGroupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    institutionId: '',
    collegeId: '',
    departmentId: '',
  });

  useEffect(() => {
    fetch('/api/v1/institutions')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInstitutions(data.data);
        }
      });
  }, []);

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/v1/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
          institutionId: formData.institutionId,
          collegeId: formData.collegeId || undefined,
          departmentId: formData.departmentId || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/groups/${data.data.slug}`);
      } else {
        alert(data.error?.message || '创建失败');
      }
    } catch (error) {
      alert('创建失败');
    } finally {
      setLoading(false);
    }
  };

  const selectedInstitution = institutions.find((i) => i.id === formData.institutionId);
  const selectedCollege = selectedInstitution?.colleges.find((c) => c.id === formData.collegeId);

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-6">
        <Link href="/groups" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回课题组列表
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>创建课题组</CardTitle>
          <CardDescription>创建一个新的研究团队</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">课题组名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="例如：人工智能实验室"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL 别名 *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="例如：ai-lab"
                required
              />
              <p className="text-xs text-muted-foreground">
                访问地址：/groups/{formData.slug || '<slug>'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">简介</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="简要描述课题组的研究方向和成果..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="institution">机构 *</Label>
              <Select
                value={formData.institutionId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, institutionId: value, collegeId: '', departmentId: '' }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择机构" />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map((institution) => (
                    <SelectItem key={institution.id} value={institution.id}>
                      {institution.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedInstitution && selectedInstitution.colleges.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="college">学院</Label>
                <Select
                  value={formData.collegeId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, collegeId: value, departmentId: '' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择学院（可选）" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedInstitution.colleges.map((college) => (
                      <SelectItem key={college.id} value={college.id}>
                        {college.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedCollege && selectedCollege.departments.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="department">系所</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, departmentId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择系所（可选）" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCollege.departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? '创建中...' : '创建课题组'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
