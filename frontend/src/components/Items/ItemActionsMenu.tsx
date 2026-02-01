import { EllipsisVertical } from 'lucide-react'
import { useState } from 'react'

import type { ItemPublic } from '@/lib/client'

import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import DeleteItem from '../Items/DeleteItem'
import EditItem from '../Items/EditItem'

interface ItemActionsMenuProps {
	item: ItemPublic
}

export const ItemActionsMenu = ({ item }: ItemActionsMenuProps) => {
	const [open, setOpen] = useState(false)

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger render={<Button variant='ghost' size='icon' />}>
				<EllipsisVertical />
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end'>
				<EditItem item={item} onSuccess={() => setOpen(false)} />
				<DeleteItem id={item.id} onSuccess={() => setOpen(false)} />
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
