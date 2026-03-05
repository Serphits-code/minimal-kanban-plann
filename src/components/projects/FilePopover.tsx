import React, { useState, useRef } from 'react'
import { Attachment } from '@/types/kanban'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  X, 
  Link as LinkIcon, 
  Desktop, 
  File, 
  Image, 
  FileDoc,
  FilePdf,
  Trash,
  CloudArrowUp
} from '@phosphor-icons/react'
import { Separator } from '@/components/ui/separator'

interface FilePopoverProps {
  children: React.ReactNode
  attachments: Attachment[]
  onAddAttachment: (attachment: Attachment) => void
  onRemoveAttachment: (attachmentId: string) => void
}

export function FilePopover({
  children,
  attachments,
  onAddAttachment,
  onRemoveAttachment,
}: FilePopoverProps) {
  const [open, setOpen] = useState(false)
  const [isAddingLink, setIsAddingLink] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkName, setLinkName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddLink = () => {
    if (!linkUrl.trim()) return
    
    const attachment: Attachment = {
      id: crypto.randomUUID(),
      name: linkName.trim() || linkUrl,
      url: linkUrl.trim(),
      type: 'link',
      size: 0,
      createdAt: new Date().toISOString()
    }
    
    onAddAttachment(attachment)
    setLinkUrl('')
    setLinkName('')
    setIsAddingLink(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach(file => {
      // For now, we'll create a blob URL - in production this would upload to server
      const url = URL.createObjectURL(file)
      
      const attachment: Attachment = {
        id: crypto.randomUUID(),
        name: file.name,
        url: url,
        type: file.type || 'file',
        size: file.size,
        createdAt: new Date().toISOString()
      }
      
      onAddAttachment(attachment)
    })

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image size={16} className="text-green-500" />
    if (type.includes('pdf')) return <FilePdf size={16} className="text-red-500" />
    if (type.includes('doc')) return <FileDoc size={16} className="text-blue-500" />
    if (type === 'link') return <LinkIcon size={16} className="text-purple-500" />
    return <File size={16} className="text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return ''
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        {isAddingLink ? (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Adicionar link</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsAddingLink(false)}
              >
                <X size={14} />
              </Button>
            </div>
            <Input
              placeholder="URL do link"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              autoFocus
            />
            <Input
              placeholder="Nome (opcional)"
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
            />
            <Button 
              className="w-full" 
              size="sm"
              onClick={handleAddLink}
              disabled={!linkUrl.trim()}
            >
              Adicionar
            </Button>
          </div>
        ) : (
          <>
            {/* Existing attachments */}
            {attachments.length > 0 && (
              <>
                <div className="p-2 max-h-48 overflow-y-auto">
                  <span className="text-xs text-muted-foreground px-2">Arquivos anexados</span>
                  <div className="mt-2 space-y-1">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-2 hover:bg-muted rounded-lg group"
                      >
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 flex-1 min-w-0"
                        >
                          {getFileIcon(attachment.type)}
                          <span className="text-sm truncate">{attachment.name}</span>
                          {attachment.size > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.size)}
                            </span>
                          )}
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                          onClick={() => onRemoveAttachment(attachment.id)}
                        >
                          <Trash size={12} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Add options */}
            <div className="p-2 space-y-1">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              
              <button
                className="flex items-center gap-2 w-full p-2 hover:bg-primary/10 bg-primary/5 text-primary rounded-lg transition-colors text-sm font-medium"
                onClick={() => fileInputRef.current?.click()}
              >
                <Desktop size={16} />
                A partir do Computador
              </button>
              
              <button
                className="flex items-center gap-2 w-full p-2 hover:bg-muted rounded-lg transition-colors text-sm"
                onClick={() => setIsAddingLink(true)}
              >
                <LinkIcon size={16} className="text-muted-foreground" />
                Do Link
              </button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
