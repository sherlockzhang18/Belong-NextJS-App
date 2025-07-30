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

                const response = await axios.get(`/api/events/${eventId}/stadium`);
                
                if (!response.data.hasStadium || !response.data.hasSections) {
                    setError('Stadium layout not available for this event. Please set up the stadium data first.');
                    return;
                }

                setStadium(response.data.stadium);
                setSections(response.data.sections);
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

    const handleSectionClick = (sectionId: string, sectionName: string) => {
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
                                        section.display_config?.default_color || "#4A90E2"
                                    }
                                    stroke="#333"
                                    strokeWidth="1"
                                    style={{
                                        transition: 'fill 0.2s ease',
                                        cursor: 'pointer',
                                        opacity: 1
                                    }}
                                    onMouseEnter={() => setHoveredSection(section.id)}
                                    onMouseLeave={() => setHoveredSection(null)}
                                    onClick={() => handleSectionClick(section.id, section.section_name)}
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
                    Click on any section in the stadium diagram above to view detailed seating
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Showing {filteredSections.length} sections • Use the tabs above to filter by level
                </Typography>
            </Box>
        </Box>
    );
}
