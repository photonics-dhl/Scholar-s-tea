'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { GroupWithRelations } from '@/types';

const roleLabels = {
  LEADER: '负责人',
  ADVISOR: '顾问',
  MEMBER: '成员',
};

export default function GroupSettingsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();
  const [group, setGroup] = useState<GroupWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await fetch(`/api/v1/groups/${slug}`);
        const data = await res.json();

        if (data.success) {
          setGroup(data.data);
        } else {
          router.push('/groups');
        }
      } catch (err) {
        router.push('/groups');
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [slug, router]);

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('确定要移除该成员吗？')) return;

    try {
      const res = await fetch(`/api/v1/groups/${slug}/members?userId=${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setGroup((prev) =>
          prev
            ? {
                ...prev,
                members: prev.members.filter((m) => m.user.id !== userId),
                _count: { ...prev._count, members: prev._count.members - 1 },
              }
            : null
        );
      }
    } catch (error) {
      alert('移除失败');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted" />
          <div className="h-64 bg-muted" />
        </div>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-6">
        <Link
          href={`/groups/${slug}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回课题组主页
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">课题组设置</h1>
        <p className="mt-1 text-muted-foreground">管理课题组成员和基本信息</p>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>课题组的基本信息</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>名称</Label>
                  <Input value={group.name} disabled />
                </div>
                <div className="space-y-2">
                  <Label>URL 别名</Label>
                  <Input value={group.slug} disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label>机构</Label>
                <Input value={group.institution.name} disabled />
              </div>
              <div className="space-y-2">
                <Label>简介</Label>
                <Textarea value={group.description || ''} disabled rows={4} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>成员管理</CardTitle>
                <CardDescription>管理课题组成员（共 {group._count.members} 人）</CardDescription>
              </div>
              <Button onClick={() => setAddMemberOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                添加成员
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {group.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.user.avatar || undefined} />
                      <AvatarFallback>
                        {member.user.name?.[0] || member.user.email[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.user.name || '未命名用户'}</p>
                      <p className="text-sm text-muted-foreground">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{roleLabels[member.role]}</Badge>
                    {member.role !== 'LEADER' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.user.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加成员</DialogTitle>
            <DialogDescription>输入用户邮箱添加课题组成员</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">用户邮箱</Label>
              <Input id="email" type="email" placeholder="user@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">角色</Label>
              <Select defaultValue="MEMBER">
                <SelectTrigger>
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEADER">负责人</SelectItem>
                  <SelectItem value="ADVISOR">顾问</SelectItem>
                  <SelectItem value="MEMBER">成员</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>
              取消
            </Button>
            <Button
              onClick={async () => {
                // TODO: Implement member addition by email
                setAddMemberOpen(false);
              }}
            >
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
