'use client'

import * as React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import { StarterKit } from '@tiptap/starter-kit'
import { Link } from '@tiptap/extension-link'
import { CharacterCount } from '@tiptap/extension-character-count'
import { Placeholder } from '@tiptap/extension-placeholder'
import {
  AlignLeft,
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

const MAX_DESCRIPTION_LENGTH = 2000

type DescriptionInputProps = {
  value: string
  onChange: (next: string) => void
}

export function DescriptionInput({ value, onChange }: DescriptionInputProps) {
  const t = useTranslations('events.fields')
  const tEditor = useTranslations('events.editor.description')

  // Link popover state lives outside the editor — when the user clicks
  // Link in the bubble menu, swap the formatting toolbar for a URL input
  // until they save or cancel.
  const [linkPopoverOpen, setLinkPopoverOpen] = React.useState(false)
  const [linkUrlInput, setLinkUrlInput] = React.useState('')

  const editor = useEditor({
    // SSR safety: TipTap v3 defers initial render until client hydration
    // when this flag is set, avoiding the markup-mismatch warning when
    // ProseMirror's internal state diverges between server and client.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Disable everything outside the [ui-6b] scope (D5). The
        // BubbleMenu only exposes bold/italic/lists/link; preventing
        // these at the extension level means paste-from-Word and
        // similar can't smuggle a <blockquote> or <h2> in either.
        //
        // link: false — StarterKit v3 ships Link by default; without
        // this disable, our explicit Link.configure() below would
        // register a SECOND link mark, corrupting ProseMirror's schema
        // and silently breaking the editor command chain (BubbleMenu
        // toggles fail, getHTML output can drift, form submit doesn't
        // see updates). We want our explicit Link config — target/rel/
        // protocols — so disable StarterKit's instead of removing ours.
        heading: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        strike: false,
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        protocols: ['http', 'https', 'mailto', 'tel'],
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer nofollow',
        },
      }),
      CharacterCount.configure({
        limit: MAX_DESCRIPTION_LENGTH,
      }),
      Placeholder.configure({
        placeholder: tEditor('placeholder'),
        emptyEditorClass:
          'before:absolute before:pointer-events-none before:text-foreground-faint before:content-[attr(data-placeholder)]',
      }),
    ],
    content: value,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          'min-h-[120px] w-full rounded-xl border border-border-default bg-surface-subtle px-3 py-2.5 text-sm text-white',
          'focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400/60',
          // Prose styling for rendered content inside the editor. Same
          // selectors are applied on the public event page so the editor
          // preview matches the saved render. See page.tsx for the read
          // side; keep these in sync.
          '[&_p:not(:last-child)]:mb-3 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1',
          '[&_strong]:font-semibold [&_em]:italic [&_a]:text-brand-300 [&_a]:underline [&_a:hover]:text-brand-200',
        ),
      },
    },
  })

  // CharacterCount lives in editor.storage. Pull it on every render for
  // the count display. Optional chaining covers the brief pre-mount tick
  // before useEditor returns a non-null instance.
  const used = editor?.storage.characterCount.characters() ?? 0
  const overLimit = used > MAX_DESCRIPTION_LENGTH

  function openLinkPopover() {
    if (!editor) return
    setLinkUrlInput((editor.getAttributes('link').href as string) ?? '')
    setLinkPopoverOpen(true)
  }

  function saveLink() {
    if (!editor) return
    const url = linkUrlInput.trim()
    if (url === '') {
      editor.chain().focus().unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
    setLinkPopoverOpen(false)
  }

  function cancelLink() {
    setLinkPopoverOpen(false)
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs font-medium text-foreground-muted">
        <AlignLeft className="h-3.5 w-3.5" />
        {t('descriptionLabel')}
      </label>

      <div className="relative">
        {editor && (
          <BubbleMenu
            editor={editor}
            className="z-50"
            options={{
              placement: 'top',
              offset: 8,
            }}
          >
            {!linkPopoverOpen ? (
              <div className="flex items-center gap-0.5 rounded-lg border border-border-subtle bg-surface-floating p-1 shadow-2xl backdrop-blur-xl">
                <ToolbarButton
                  icon={Bold}
                  label={tEditor('toolbar.bold')}
                  active={editor.isActive('bold')}
                  onClick={() => editor.chain().focus().toggleBold().run()}
                />
                <ToolbarButton
                  icon={Italic}
                  label={tEditor('toolbar.italic')}
                  active={editor.isActive('italic')}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                />
                <ToolbarButton
                  icon={List}
                  label={tEditor('toolbar.bulletList')}
                  active={editor.isActive('bulletList')}
                  onClick={() =>
                    editor.chain().focus().toggleBulletList().run()
                  }
                />
                <ToolbarButton
                  icon={ListOrdered}
                  label={tEditor('toolbar.numberedList')}
                  active={editor.isActive('orderedList')}
                  onClick={() =>
                    editor.chain().focus().toggleOrderedList().run()
                  }
                />
                <ToolbarButton
                  icon={LinkIcon}
                  label={tEditor('toolbar.link')}
                  active={editor.isActive('link')}
                  onClick={openLinkPopover}
                />
              </div>
            ) : (
              <LinkPopover
                value={linkUrlInput}
                onChange={setLinkUrlInput}
                onSave={saveLink}
                onCancel={cancelLink}
                placeholder={tEditor('linkUrl.placeholder')}
                saveLabel={tEditor('linkUrl.save')}
                cancelLabel={tEditor('linkUrl.cancel')}
              />
            )}
          </BubbleMenu>
        )}

        <EditorContent editor={editor} />
      </div>

      <p
        className={cn(
          'text-right text-[10px] tabular-nums',
          overLimit ? 'text-rose-300' : 'text-foreground-faint',
        )}
      >
        {t('descriptionCharCount', { used, max: MAX_DESCRIPTION_LENGTH })}
      </p>
    </div>
  )
}

// ─── Toolbar button ─────────────────────────────────────────────────────

type ToolbarButtonProps = {
  icon: React.ComponentType<{ className?: string }>
  label: string
  active: boolean
  onClick: () => void
}

function ToolbarButton({
  icon: Icon,
  label,
  active,
  onClick,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40',
        active
          ? 'bg-brand-500/20 text-brand-200'
          : 'text-foreground-muted hover:bg-white/10 hover:text-white',
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

// ─── Link popover (inline replacement of toolbar when active) ───────────

type LinkPopoverProps = {
  value: string
  onChange: (next: string) => void
  onSave: () => void
  onCancel: () => void
  placeholder: string
  saveLabel: string
  cancelLabel: string
}

function LinkPopover({
  value,
  onChange,
  onSave,
  onCancel,
  placeholder,
  saveLabel,
  cancelLabel,
}: LinkPopoverProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Focus the URL input on mount so the user can type immediately.
  React.useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-floating p-1 shadow-2xl backdrop-blur-xl">
      <input
        ref={inputRef}
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onSave()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            onCancel()
          }
        }}
        placeholder={placeholder}
        className="w-56 rounded-md border-0 bg-transparent px-2 py-1 text-sm text-white placeholder:text-foreground-faint focus:outline-none focus:ring-2 focus:ring-brand-400/40"
      />
      <button
        type="button"
        onClick={onSave}
        className="rounded-md px-2 py-1 text-xs font-medium text-brand-200 hover:bg-brand-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40"
      >
        {saveLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-md px-2 py-1 text-xs font-medium text-foreground-muted hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40"
      >
        {cancelLabel}
      </button>
    </div>
  )
}
