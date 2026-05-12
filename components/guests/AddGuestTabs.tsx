'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { AddGuestForm } from '@/components/guests/AddGuestForm'
import { ContactsTab } from '@/components/guests/ContactsTab'
import { PasteTab } from '@/components/guests/PasteTab'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { isContactsPickerSupported } from '@/lib/contacts-picker'
import { cn } from '@/lib/utils'

export function AddGuestTabs({ eventId }: { eventId: string }) {
  const t = useTranslations('events.guests.bulk')

  // Contacts tab is post-mount only. SSR has no `navigator`, and even on
  // a hydrated client the picker only exists on Android Chromium browsers
  // — re-checking after mount keeps SSR/CSR identical for the first paint
  // and avoids the picker being "visible but useless" on unsupported
  // surfaces.
  const [showContacts, setShowContacts] = React.useState(false)
  React.useEffect(() => {
    setShowContacts(isContactsPickerSupported())
  }, [])

  const triggerClass =
    'flex-1 rounded-md text-white/70 data-active:bg-white/10 data-active:text-white'

  return (
    <Tabs defaultValue="single" className="w-full">
      <TabsList
        variant="line"
        className={cn('w-full bg-black/30 ring-1 ring-white/10 backdrop-blur-md')}
      >
        <TabsTrigger value="single" className={triggerClass}>
          {t('tabSingle')}
        </TabsTrigger>
        <TabsTrigger value="paste" className={triggerClass}>
          {t('tabPaste')}
        </TabsTrigger>
        {showContacts && (
          <TabsTrigger value="contacts" className={triggerClass}>
            {t('tabContacts')}
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="single" className="mt-3">
        <AddGuestForm eventId={eventId} />
      </TabsContent>
      <TabsContent value="paste" className="mt-3">
        <PasteTab eventId={eventId} />
      </TabsContent>
      {showContacts && (
        <TabsContent value="contacts" className="mt-3">
          <ContactsTab eventId={eventId} />
        </TabsContent>
      )}
    </Tabs>
  )
}
