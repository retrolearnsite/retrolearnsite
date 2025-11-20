import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'

interface SharedNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Minimal shape used by WorkRoom page
  note?: {
    title?: string | null
    summary?: string | null
    original_content?: string | null
    key_points?: string[] | null
  } | null
}

export default function SharedNoteDialog({ open, onOpenChange, note }: SharedNoteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <DialogTitle className="font-retro text-2xl">{note?.title || 'Shared Note'}</DialogTitle>
          <DialogDescription className="font-retro">Preview of the shared note</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {note?.summary && (
              <section className="space-y-3">
                <h3 className="text-sm font-retro font-semibold text-primary uppercase tracking-wide">Summary</h3>
                <div className="font-retro text-sm leading-[1.9] space-y-4 text-foreground/90">
                  {note.summary.split('\n\n').map((paragraph: string, idx: number) => (
                    <p key={idx} className="last:mb-0">
                      {paragraph.split('\n').map((line: string, lineIdx: number) => (
                        <span key={lineIdx}>
                          {line}
                          {lineIdx < paragraph.split('\n').length - 1 && <br />}
                        </span>
                      ))}
                    </p>
                  ))}
                </div>
              </section>
            )}

            {Array.isArray(note?.key_points) && note?.key_points?.length ? (
              <section className="space-y-3">
                <h3 className="text-sm font-retro font-semibold text-primary uppercase tracking-wide">Key Points</h3>
                <ul className="list-disc pl-6 font-retro text-sm leading-relaxed space-y-2.5 text-foreground/90">
                  {note.key_points!.map((kp, i) => (
                    <li key={i} className="pl-2">{kp}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {!note?.summary && note?.original_content && (
              <section className="space-y-3">
                <h3 className="text-sm font-retro font-semibold text-primary uppercase tracking-wide">Excerpt</h3>
                <div className="border-2 border-border/50 rounded-xl p-5 bg-muted/30">
                  <p className="font-retro text-sm leading-[1.8] whitespace-pre-wrap text-foreground/90">
                    {note.original_content?.slice(0, 1200)}
                  </p>
                </div>
              </section>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              if (note?.summary) {
                navigator.clipboard.writeText(note.summary);
              }
            }}
            disabled={!note?.summary}
            className="font-retro"
          >
            Copy Summary
          </Button>
          <Button onClick={() => onOpenChange(false)} className="font-retro">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
