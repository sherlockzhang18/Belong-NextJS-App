import React, { useState } from 'react'
import { DataGrid, GridColDef, GridCellParams, GridRowParams, GridActionsCellItem } from '@mui/x-data-grid'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import Snackbar from '@mui/material/Snackbar'
import Box from '@mui/material/Box'

import EventForm from './EventForm'
import { useEvents } from '../services/useEvents'
import type { RawEvent, EventInput } from '../services/eventUtils'
import { parseRawEvent } from '../services/eventUtils'

export default function AdminEventsGrid() {
    const { events, loading, error, create, update, remove } = useEvents()
    const [openDialog, setOpenDialog] = useState(false)
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
        {
            field: 'name',
            headerName: 'Name',
            flex: 1,
        },
        {
            field: 'date',
            headerName: 'Date',
            width: 120,
            valueGetter: (params: GridCellParams<RawEvent>) => {
                const ev = parseRawEvent(params.row)
                return ev.date ? ev.date.format('YYYY-MM-DD') : ''
            },
        },
        {
            field: 'start_time',
            headerName: 'Start',
            width: 100,
            valueGetter: (params: GridCellParams<RawEvent>) => {
                const ev = parseRawEvent(params.row)
                return ev.start_time
                    ? ev.start_time.getDayjs().format('HH:mm')
                    : ''
            },
        },
        {
            field: 'price',
            headerName: 'Price',
            width: 100,
            valueGetter: (params: GridCellParams<RawEvent>) => {
                const raw = params.row.metadata?.price
                return raw ? parseFloat(raw).toFixed(2) : ''
            },
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            width: 100,
            getActions: (params: GridRowParams<RawEvent>) => [
                <GridActionsCellItem
                    key="edit"
                    icon={<EditIcon />}
                    label="Edit"
                    onClick={() => {
                        setEditing(toInput(params.row))
                        setOpenDialog(true)
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
        <Box>
            <Box mb={2}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        setEditing(null)
                        setOpenDialog(true)
                    }}
                >
                    New Event
                </Button>
            </Box>

            <div style={{ height: 600, width: '100%' }}>
                <DataGrid<RawEvent>
                    rows={events}
                    columns={columns}
                    loading={loading}
                    getRowId={(r) => r.uuid}
                />
            </div>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
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
                        setOpenDialog(false)
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
