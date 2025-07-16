import useSWR from 'swr'
import { TicketOption } from '@/drizzle/schema'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useTicketOptions(eventId?: string) {
    const { data, error, mutate } = useSWR<TicketOption[]>(
        eventId ? `/api/admin/ticket-options?event_id=${eventId}` : null,
        fetcher
    )

    const createTicketOption = async (option: Omit<TicketOption, 'id'>) => {
        const response = await fetch('/api/admin/ticket-options', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(option),
        })
        if (!response.ok) throw new Error('Failed to create ticket option')
        const newOption = await response.json()
        mutate() // Refresh the data
        return newOption
    }

    const updateTicketOption = async (id: string, option: Partial<TicketOption>) => {
        const response = await fetch('/api/admin/ticket-options', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...option }),
        })
        if (!response.ok) throw new Error('Failed to update ticket option')
        const updatedOption = await response.json()
        mutate() // Refresh the data
        return updatedOption
    }

    const deleteTicketOption = async (id: string) => {
        const response = await fetch(`/api/admin/ticket-options?id=${id}`, {
            method: 'DELETE',
        })
        if (!response.ok) throw new Error('Failed to delete ticket option')
        mutate() // Refresh the data
    }

    return {
        ticketOptions: data,
        isLoading: !error && !data,
        isError: error,
        createTicketOption,
        updateTicketOption,
        deleteTicketOption,
        mutate,
    }
} 