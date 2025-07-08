import React, { JSX, useState } from 'react'
import { DataGrid, GridColDef, GridRowParams, GridActionsCellItem} from '@mui/x-data-grid'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import Snackbar from '@mui/material/Snackbar'

import EventForm from './EventForm'
import { useEvents } from '../services/useEvents'
import { parseRawEvent } from '../services/eventUtils'
import type { RawEvent, EventInput } from '../services/eventUtils'

export default function AdminEventsGrid(): JSX.Element {
    const { events, loading, error, create, update, remove } = useEvents()

    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<EventInput | null>(null)
    const [snack, setSnack] = useState<{ open: boolean; message: string }>({
        open: false,
        message: '',
    })

    const toInput = (raw: RawEvent): EventInput => {
        const ev = parseRawEvent(raw)
        const fmtDate = (d: any) => d.format('YYYY-MM-DD')
        const fmtTime = (t: any) => t.getDayjs().format('HH:mm')
        const files = Array.isArray(raw.metadata?.files) ? raw.metadata.files : []

        return {
            uuid: ev.uuid,
            name: ev.name,
            subtitle: ev.subtitle ?? '',
            description: ev.metadata?.description ?? '',
            date: ev.date ? fmtDate(ev.date) : '',
            end_date: ev.end_date ? fmtDate(ev.end_date) : '',
            start_time: ev.start_time ? fmtTime(ev.start_time) : '',
            end_time: ev.end_time ? fmtTime(ev.end_time) : '',
            location_name: ev.location_name ?? '',
            images: files,
            price: ev.metadata?.price ?? '',
            ticketing_link: ev.metadata?.ticketing_link ?? '',
        }
    }

    const columns: GridColDef<RawEvent>[] = [
        { field: 'name', headerName: 'Name', width: 200 },
        {
            field: 'subtitle',
            headerName: 'Subtitle',
            width: 200,
            renderCell: ({ row }) => row.subtitle ?? '',
        },
        {
            field: 'description',
            headerName: 'Description',
            width: 300,
            renderCell: ({ row }) => row.metadata?.description ?? '',
        },
        {
            field: 'date',
            headerName: 'Start Date',
            width: 120,
            renderCell: ({ row }) => {
                const ev = parseRawEvent(row)
                return ev.date ? ev.date.format('YYYY-MM-DD') : ''
            },
        },
        {
            field: 'end_date',
            headerName: 'End Date',
            width: 120,
            renderCell: ({ row }) => {
                const ev = parseRawEvent(row)
                return ev.end_date ? ev.end_date.format('YYYY-MM-DD') : ''
            },
        },
        {
            field: 'start_time',
            headerName: 'Start Time',
            width: 100,
            renderCell: ({ row }) => {
                const ev = parseRawEvent(row)
                return ev.start_time
                    ? ev.start_time.getDayjs().format('HH:mm')
                    : ''
            },
        },
        {
            field: 'end_time',
            headerName: 'End Time',
            width: 100,
            renderCell: ({ row }) => {
                const ev = parseRawEvent(row)
                return ev.end_time
                    ? ev.end_time.getDayjs().format('HH:mm')
                    : ''
            },
        },
        {
            field: 'location_name',
            headerName: 'Location',
            width: 200,
            renderCell: ({ row }) => row.location_name ?? '',
        },
        {
            field: 'price',
            headerName: 'Price',
            width: 100,
            renderCell: ({ row }) => {
                const p = parseRawEvent(row).metadata?.price
                return p ? parseFloat(p).toFixed(2) : ''
            },
        },
        {
            field: 'ticketing_link',
            headerName: 'Ticket Link',
            width: 200,
            renderCell: ({ row }) => row.metadata?.ticketing_link ?? '',
        },
        {
            field: 'files',
            headerName: 'Images',
            width: 200,
            renderCell: ({ row }) => (row.metadata?.files || []).join(', '),
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            width: 120,
            getActions: (params: GridRowParams<RawEvent>) => [
                <GridActionsCellItem
                    key="edit"
                    icon={<EditIcon />}
                    label="Edit"
                    onClick={() => {
                        setEditing(toInput(params.row))
                        setOpen(true)
                    }}
                />,
                <GridActionsCellItem
                    key="delete"
                    icon={<DeleteIcon />}
                    label="Delete"
                    onClick={async () => {
                        await remove(params.row.uuid)
                        setSnack({ open: true, message: 'Deleted' })
                    }}
                />,
            ],
        },
    ]

    if (error) {
        return <p style={{ color: 'red' }}>Error loading events</p>
    }

    return (
        <Box
            component="section"
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
            <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        setEditing(null)
                        setOpen(true)
                    }}
                >
                    New Event
                </Button>
            </Box>

            <Box sx={{ overflowX: 'auto' }}>
                <DataGrid<RawEvent> 
                    rows={events}
                    columns={columns}
                    loading={loading}
                    getRowId={(r) => r.uuid}
                    autoHeight
                    pagination
                    initialState={{
                        pagination: { paginationModel: { page: 0, pageSize: 25 } },
                    }}
                    pageSizeOptions={[25]}
                    sx={{ overflowX: 'auto' }}
                />
            </Box>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <EventForm
                    initial={editing ?? undefined}
                    onSubmit={async (vals) => {
                        if (editing) {
                            await update(vals)
                            setSnack({ open: true, message: 'Updated' })
                        } else {
                            await create(vals)
                            setSnack({ open: true, message: 'Created' })
                        }
                        setOpen(false)
                    }}
                    onSuccess={() => { }}
                />
            </Dialog>

            <Snackbar
                open={snack.open}
                message={snack.message}
                autoHideDuration={3000}
                onClose={() => setSnack((s) => ({ ...s, open: false }))}
            />
        </Box>
    )
}
