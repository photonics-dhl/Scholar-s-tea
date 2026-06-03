'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Settings, User, Mail, Bell, Shield, Save, Loader2, GraduationCap, BookOpen, FlaskConical, Library, Database, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils/cn'

interface UserProfile {
  id: string
  email: string
  name: string | null
  bio: string | null
  avatar: string | null
}

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [fetchingProfile, setFetchingProfile] = useState(true)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    academicProfile: {
      researchField: [] as string[],
      educationLevel: '',
      institution: '',
      position: '',
      interests: [] as string[],
      skills: [] as string[],
      publications: [] as string[],
      bioDetail: '',
    },
    notifications: {
      email: true,
      push: false,
      mentions: true,
    },
    privacy: {
      publicProfile: true,
      showEmail: false,
    },
    knowledgeBase: {
      provider: 'api' as 'api' | 'local',
      apiKey: '',
      baseUrl: 'https://api.z.ai/api/coding/paas/v4',
      model: 'text-embedding-3-small',
      localModel: 'Xenova/all-MiniLM-L6-v2',
    },
  })

  // Load embedding config from IndexedDB on mount
  useEffect(() => {
    import('@/lib/personal-kb/storage').then(({ getEmbeddingConfig }) => {
      getEmbeddingConfig().then((config) => {
        if (config) {
          setFormData((prev) => ({
            ...prev,
            knowledgeBase: {
              provider: config.provider,
              apiKey: config.provider === 'api' ? config.apiKey : '',
              baseUrl: config.provider === 'api' ? config.baseUrl : prev.knowledgeBase.baseUrl,
              model: config.provider === 'api' ? config.model : prev.knowledgeBase.model,
              localModel: config.provider === 'local' ? config.model : prev.knowledgeBase.localModel,
            },
          }))
        }
      })
    })
  }, [])

  // Fetch full profile on mount
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetch('/api/v1/user/profile')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setProfile(data.data)
            setFormData((prev) => ({
              ...prev,
              name: data.data.name || '',
              email: data.data.email || '',
              bio: data.data.bio || '',
              academicProfile: data.data.academicProfile || prev.academicProfile,
            }))
          }
        })
        .catch((err) => console.error('Failed to fetch profile:', err))
        .finally(() => setFetchingProfile(false))
    }
  }, [status, session])

  // Sync with session changes
  useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        name: session.user.name || prev.name || '',
        email: session.user.email || prev.email || '',
      }))
    }
  }, [session])

  const handleSaveKBConfig = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { saveEmbeddingConfig } = await import('@/lib/personal-kb/storage')
      const { setApiEmbeddingConfig } = await import('@/lib/personal-kb/embedder')
      const kb = formData.knowledgeBase
      if (kb.provider === 'api') {
        const config = {
          provider: 'api' as const,
          apiKey: kb.apiKey,
          baseUrl: kb.baseUrl,
          model: kb.model,
        }
        await saveEmbeddingConfig(config)
        setApiEmbeddingConfig(config)
      } else {
        await saveEmbeddingConfig({
          provider: 'local',
          model: kb.localModel,
        })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setLoading(false)
    }
  }, [formData.knowledgeBase])

  if (status === 'loading' || fetchingProfile) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session?.user) {
    router.push('/signin')
    return null
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim() || undefined,
          bio: formData.bio.trim() || null,
          academicProfile: formData.academicProfile,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error?.message || '保存失败')
      }

      // Update NextAuth session
      await update({
        name: data.data.name,
        bio: data.data.bio,
        academicProfile: data.data.academicProfile,
      })

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setLoading(false)
    }
  }

  const initials = session.user.name?.charAt(0).toUpperCase() || session.user.email?.charAt(0).toUpperCase() || 'U'

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-7 w-7 text-primary" />
          设置
        </h1>
        <p className="text-muted-foreground mt-1">管理你的账户和偏好设置</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 max-w-lg">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            个人资料
          </TabsTrigger>
          <TabsTrigger value="academic">
            <GraduationCap className="h-4 w-4 mr-2" />
            学术画像
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            通知
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Shield className="h-4 w-4 mr-2" />
            隐私
          </TabsTrigger>
          <TabsTrigger value="knowledge">
            <Library className="h-4 w-4 mr-2" />
            知识库
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>个人资料</CardTitle>
              <CardDescription>更新你的基本信息和头像</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={session.user.image || undefined} alt={session.user.name || '用户'} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm" disabled>
                    更换头像
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">支持 JPG、PNG 格式，最大 2MB</p>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">昵称</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="你的昵称"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input id="email" value={formData.email} disabled className="bg-muted" />
                </div>
                <p className="text-xs text-muted-foreground">邮箱地址不可修改</p>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">个人简介</Label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="简要介绍你的研究方向和兴趣..."
                  className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">{formData.bio.length}/500</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>通知设置</CardTitle>
              <CardDescription>选择你希望接收的通知类型（当前为演示状态）</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>邮件通知</Label>
                  <p className="text-sm text-muted-foreground">接收重要更新和活动的邮件</p>
                </div>
                <ToggleButton
                  checked={formData.notifications.email}
                  onChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, email: checked },
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>提及通知</Label>
                  <p className="text-sm text-muted-foreground">当有人提及你时发送通知</p>
                </div>
                <ToggleButton
                  checked={formData.notifications.mentions}
                  onChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, mentions: checked },
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>推送通知</Label>
                  <p className="text-sm text-muted-foreground">浏览器桌面推送通知</p>
                </div>
                <ToggleButton
                  checked={formData.notifications.push}
                  onChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, push: checked },
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Profile Tab */}
        <TabsContent value="academic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                学术画像
              </CardTitle>
              <CardDescription>完善你的学术背景，帮助 AI 更好地为你提供个性化服务</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Institution */}
              <div className="space-y-2">
                <Label htmlFor="institution">
                  <FlaskConical className="h-4 w-4 inline mr-1" />
                  所在机构
                </Label>
                <Input
                  id="institution"
                  value={formData.academicProfile.institution}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      academicProfile: { ...prev.academicProfile, institution: e.target.value },
                    }))
                  }
                  placeholder="例如：浙江大学"
                />
              </div>

              {/* Position */}
              <div className="space-y-2">
                <Label htmlFor="position">职位/身份</Label>
                <Input
                  id="position"
                  value={formData.academicProfile.position}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      academicProfile: { ...prev.academicProfile, position: e.target.value },
                    }))
                  }
                  placeholder="例如：博士研究生 / 副教授 / 研究员"
                />
              </div>

              {/* Education Level */}
              <div className="space-y-2">
                <Label htmlFor="educationLevel">最高学历</Label>
                <select
                  id="educationLevel"
                  value={formData.academicProfile.educationLevel}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      academicProfile: { ...prev.academicProfile, educationLevel: e.target.value },
                    }))
                  }
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">请选择</option>
                  <option value="本科">本科</option>
                  <option value="硕士">硕士</option>
                  <option value="博士">博士</option>
                  <option value="博士后">博士后</option>
                  <option value="其他">其他</option>
                </select>
              </div>

              {/* Research Fields */}
              <TagInput
                label="研究领域"
                icon={<BookOpen className="h-4 w-4" />}
                placeholder="输入后按回车添加，例如：光学、材料科学"
                tags={formData.academicProfile.researchField}
                onChange={(tags) =>
                  setFormData((prev) => ({
                    ...prev,
                    academicProfile: { ...prev.academicProfile, researchField: tags },
                  }))
                }
              />

              {/* Interests */}
              <TagInput
                label="感兴趣的方向"
                placeholder="输入后按回车添加"
                tags={formData.academicProfile.interests}
                onChange={(tags) =>
                  setFormData((prev) => ({
                    ...prev,
                    academicProfile: { ...prev.academicProfile, interests: tags },
                  }))
                }
              />

              {/* Skills */}
              <TagInput
                label="专业技能"
                placeholder="输入后按回车添加，例如：Python、COMSOL、LaTeX"
                tags={formData.academicProfile.skills}
                onChange={(tags) =>
                  setFormData((prev) => ({
                    ...prev,
                    academicProfile: { ...prev.academicProfile, skills: tags },
                  }))
                }
              />

              {/* Bio Detail */}
              <div className="space-y-2">
                <Label htmlFor="bioDetail">详细学术简介</Label>
                <textarea
                  id="bioDetail"
                  value={formData.academicProfile.bioDetail}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      academicProfile: { ...prev.academicProfile, bioDetail: e.target.value },
                    }))
                  }
                  placeholder="描述你的研究经历、擅长方向、合作意向等..."
                  className="w-full min-h-[120px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.academicProfile.bioDetail.length}/2000
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>隐私设置</CardTitle>
              <CardDescription>控制你的资料可见性（当前为演示状态）</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>公开资料</Label>
                  <p className="text-sm text-muted-foreground">允许其他用户查看你的个人资料</p>
                </div>
                <ToggleButton
                  checked={formData.privacy.publicProfile}
                  onChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      privacy: { ...prev.privacy, publicProfile: checked },
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>显示邮箱</Label>
                  <p className="text-sm text-muted-foreground">在个人资料中公开你的邮箱地址</p>
                </div>
                <ToggleButton
                  checked={formData.privacy.showEmail}
                  onChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      privacy: { ...prev.privacy, showEmail: checked },
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Library className="h-5 w-5 text-primary" />
                私人知识库配置
              </CardTitle>
              <CardDescription>配置向量嵌入模型，用于私人知识库的语义检索</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Provider Selection */}
              <div className="space-y-3">
                <Label>嵌入模型来源</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        knowledgeBase: { ...prev.knowledgeBase, provider: 'api' },
                      }))
                    }
                    className={cn(
                      'p-3 rounded-lg border text-left transition-colors',
                      formData.knowledgeBase.provider === 'api'
                        ? 'border-primary bg-primary/5'
                        : 'border-input hover:bg-muted/50'
                    )}
                  >
                    <p className="text-sm font-medium">API 模式（推荐）</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      调用 OpenAI-compatible API，速度快、质量高
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        knowledgeBase: { ...prev.knowledgeBase, provider: 'local' },
                      }))
                    }
                    className={cn(
                      'p-3 rounded-lg border text-left transition-colors',
                      formData.knowledgeBase.provider === 'local'
                        ? 'border-primary bg-primary/5'
                        : 'border-input hover:bg-muted/50'
                    )}
                  >
                    <p className="text-sm font-medium">本地模式（实验性）</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      浏览器内运行 ONNX 模型，隐私更好但首次加载慢
                    </p>
                  </button>
                </div>
              </div>

              {formData.knowledgeBase.provider === 'api' ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="kb-baseUrl">API Base URL</Label>
                    <Input
                      id="kb-baseUrl"
                      value={formData.knowledgeBase.baseUrl}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          knowledgeBase: { ...prev.knowledgeBase, baseUrl: e.target.value },
                        }))
                      }
                      placeholder="https://api.openai.com/v1"
                    />
                    <p className="text-xs text-muted-foreground">
                      支持 OpenAI-compatible API，如 ZAI、SiliconFlow、OpenAI 等
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kb-apiKey">API Key</Label>
                    <Input
                      id="kb-apiKey"
                      type="password"
                      value={formData.knowledgeBase.apiKey}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          knowledgeBase: { ...prev.knowledgeBase, apiKey: e.target.value },
                        }))
                      }
                      placeholder="sk-..."
                    />
                    <p className="text-xs text-muted-foreground">
                      仅存储在本地浏览器中，不会上传到服务器
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kb-model">模型名称</Label>
                    <Input
                      id="kb-model"
                      value={formData.knowledgeBase.model}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          knowledgeBase: { ...prev.knowledgeBase, model: e.target.value },
                        }))
                      }
                      placeholder="text-embedding-3-small"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="kb-localModel">本地模型</Label>
                  <select
                    id="kb-localModel"
                    value={formData.knowledgeBase.localModel}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        knowledgeBase: { ...prev.knowledgeBase, localModel: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
                  >
                    <option value="Xenova/all-MiniLM-L6-v2">
                      all-MiniLM-L6-v2（~80MB，384-dim，推荐）
                    </option>
                    <option value="Xenova/all-MiniLM-L12-v2">
                      all-MiniLM-L12-v2（~120MB，384-dim）
                    </option>
                  </select>
                  <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      首次使用本地模型时需下载约 80MB 模型文件，请确保网络稳定。模型缓存后后续加载秒开。
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  <Database className="h-4 w-4 inline mr-1" />
                  配置仅保存在当前浏览器中
                </div>
                <Button onClick={handleSaveKBConfig} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1.5" />
                  )}
                  保存配置
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saved ? '已保存' : loading ? '保存中...' : '保存设置'}
        </Button>
      </div>
    </div>
  )
}

function TagInput({
  label,
  icon,
  placeholder,
  tags,
  onChange,
}: {
  label: string
  icon?: React.ReactNode
  placeholder?: string
  tags: string[]
  onChange: (tags: string[]) => void
}) {
  const [input, setInput] = useState('')

  const addTag = () => {
    const trimmed = input.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
      setInput('')
    }
  }

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag))
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        {icon}
        {label}
      </Label>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm bg-primary/10 text-primary"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-destructive transition-colors"
            >
              ×
            </button>
          </span>
        ))}
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTag()
            }
          }}
          onBlur={addTag}
          placeholder={placeholder}
          className="flex-1 min-w-[200px]"
        />
      </div>
    </div>
  )
}

function ToggleButton({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        checked ? 'bg-primary' : 'bg-input'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-background transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  )
}
