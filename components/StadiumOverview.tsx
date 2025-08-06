import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, CardContent, Chip, Tabs, Tab } from '@mui/material';
import axios from 'axios';

interface Stadium {
    id: string;
    name: string;
    layout_config: {
        svg_viewbox: string;
        field_position: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
    };
}

interface StadiumSection {
    id: string;
    section_number: string;
    section_name: string;
    level_type: string;
    pricing_tier: string;
    has_seats: boolean;
    display_config: {
        default_color: string;
        hover_color: string;
        position: {
            path: string;
            center_x: number;
            center_y: number;
            angle: number;
        };
    };
    is_active: boolean;
}

interface StadiumOverviewProps {
    eventId: string;
    onSectionSelect: (sectionId: string, sectionName: string) => void;
}

export default function StadiumOverview({ eventId, onSectionSelect }: StadiumOverviewProps) {
    const [stadium, setStadium] = useState<Stadium | null>(null);
    const [sections, setSections] = useState<StadiumSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hoveredSection, setHoveredSection] = useState<string | null>(null);
    const [selectedLevel, setSelectedLevel] = useState<string>('all');

    useEffect(() => {
        const fetchStadiumData = async () => {
            try {
                setLoading(true);
                setError(null);

                const stadiumResponse = await axios.get(`/api/events/${eventId}/stadium`);
                
                if (!stadiumResponse.data.hasStadium || !stadiumResponse.data.hasSections) {
                    setError('Stadium layout not available for this event. Please set up the stadium data first.');
                    return;
                }

                const availabilityResponse = await axios.get(`/api/events/${eventId}/sections-availability`);

                setStadium(stadiumResponse.data.stadium);
                const sectionsWithAvailability = availabilityResponse.data.sections.map((section: any) => ({
                    ...section,
                    display_config: stadiumResponse.data.sections.find((s: any) => s.id === section.id)?.display_config || section.display_config
                }));
                setSections(sectionsWithAvailability);
            } catch (err: any) {
                if (err.response?.status === 404) {
                    setError('Stadium data not found. Please set up Bank of America Stadium in the admin panel first.');
                } else {
                    setError(err.response?.data?.message || 'Failed to load stadium layout');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchStadiumData();
    }, [eventId]);

    const handleSectionClick = (sectionId: string, sectionName: string, hasSeats: boolean) => {
        if (!hasSeats) {
            alert(`Sorry, ${sectionName} is currently not available for ticket sales. Only select sections have seats available for this event.`);
            return;
        }
        onSectionSelect(sectionId, sectionName);
    };

    const filteredSections = selectedLevel === 'all' 
        ? sections 
        : sections.filter(s => s.level_type === selectedLevel);

    const getLevelCounts = () => {
        const counts = sections.reduce((acc, section) => {
            acc[section.level_type] = (acc[section.level_type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return counts;
    };

    if (loading) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography>Loading stadium layout...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="error" gutterBottom>
                    {error}
                </Typography>
            </Box>
        );
    }

    if (!stadium || sections.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography>No stadium data available</Typography>
            </Box>
        );
    }

    const levelCounts = getLevelCounts();

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" gutterBottom>
                    {stadium.name} - Stadium View
                </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
                <Tabs
                    value={selectedLevel}
                    onChange={(_, newValue) => setSelectedLevel(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab label={`All (${sections.length})`} value="all" />
                    {Object.entries(levelCounts).map(([level, count]) => (
                        <Tab 
                            key={level} 
                            label={`${level.charAt(0).toUpperCase() + level.slice(1)} (${count})`} 
                            value={level} 
                        />
                    ))}
                </Tabs>
            </Box>

            <Box sx={{ 
                width: '100%', 
                height: '70vh',
                border: '1px solid #ddd', 
                borderRadius: 2, 
                overflow: 'hidden',
                position: 'relative',
                bgcolor: '#f5f5f5'
            }}>
                <svg
                    width="100%"
                    height="100%"
                    viewBox={stadium.layout_config.svg_viewbox}
                    style={{ background: '#2e7d32' }}
                >
                    <rect
                        x={stadium.layout_config.field_position.x}
                        y={stadium.layout_config.field_position.y}
                        width={stadium.layout_config.field_position.width}
                        height={stadium.layout_config.field_position.height}
                        fill="#4caf50"
                        stroke="white"
                        strokeWidth="2"
                        rx="10"
                    />
                    <text x="500" y="325" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                        PANTHERS
                    </text>
                    <text x="500" y="260" textAnchor="middle" fill="white" fontSize="10">
                        FIELD
                    </text>

                    {filteredSections.map((section) => {
                        const position = section.display_config?.position;
                        if (!position?.path) {
                            return null;
                        }
                        
                        return (
                            <g key={section.id}>
                                <path
                                    d={position.path}
                                    fill={hoveredSection === section.id ? 
                                        section.display_config?.hover_color || "#FF5722" : 
                                        section.has_seats 
                                            ? (section.display_config?.default_color || "#4A90E2")
                                            : "#CCCCCC"
                                    }
                                    stroke="#333"
                                    strokeWidth="1"
                                    style={{
                                        transition: 'fill 0.2s ease',
                                        cursor: section.has_seats ? 'pointer' : 'not-allowed',
                                        opacity: section.has_seats ? 1 : 0.6
                                    }}
                                    onMouseEnter={() => setHoveredSection(section.id)}
                                    onMouseLeave={() => setHoveredSection(null)}
                                    onClick={() => handleSectionClick(section.id, section.section_name, section.has_seats)}
                                />
                                <text
                                    x={position.center_x || 500}
                                    y={position.center_y || 250}
                                    textAnchor="middle"
                                    fill="white"
                                    fontSize="10"
                                    fontWeight="bold"
                                    pointerEvents="none"
                                >
                                    {section.section_number}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </Box>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                    Click on any highlighted section to view detailed seating
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Showing {filteredSections.length} sections • {filteredSections.filter(s => s.has_seats).length} sections have seats available
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 16, height: 16, backgroundColor: '#4A90E2', border: '1px solid #333' }} />
                        <Typography variant="body2">Available Sections</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 16, height: 16, backgroundColor: '#CCCCCC', border: '1px solid #333', opacity: 0.6 }} />
                        <Typography variant="body2">Not Available</Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
