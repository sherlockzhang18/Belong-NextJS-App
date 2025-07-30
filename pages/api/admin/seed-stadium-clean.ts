import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../utils/db';
import { stadiums, stadium_sections } from '../../../drizzle/schema';
import { bankOfAmericaStadiumData } from '../../../data/bank-of-america-stadium';
import { eq } from 'drizzle-orm';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'POST') {
        try {
            const existingStadium = await db
                .select()
                .from(stadiums)
                .where(eq(stadiums.name, 'Bank of America Stadium'))
                .limit(1);

            if (existingStadium.length > 0) {
                return res.status(200).json({
                    message: 'Bank of America Stadium already exists',
                    stadium: existingStadium[0],
                    alreadyExists: true
                });
            }

            console.log('Seeding Bank of America Stadium data...');

            const [stadium] = await db
                .insert(stadiums)
                .values({
                    name: bankOfAmericaStadiumData.stadium.name,
                    city: bankOfAmericaStadiumData.stadium.city,
                    state: bankOfAmericaStadiumData.stadium.state,
                    layout_config: bankOfAmericaStadiumData.stadium.layout_config
                })
                .returning();

            console.log(`Inserted stadium: ${stadium.name}`);

            const sectionsToInsert = bankOfAmericaStadiumData.sections.map(section => ({
                stadium_id: stadium.id,
                section_number: section.section_number,
                section_name: `${section.level_type.charAt(0).toUpperCase() + section.level_type.slice(1)} Level ${section.section_number}`,
                level_type: section.level_type,
                max_row: 'Z',
                seats_per_row: 20,
                pricing_tier: section.pricing_tier,
                display_config: {
                    default_color: getLevelColor(section.level_type),
                    hover_color: "#FF5722",
                    position: calculateSectionPosition(section.section_number, section.level_type)
                },
                is_active: true
            }));

            await db.insert(stadium_sections).values(sectionsToInsert);

            console.log(`Inserted ${sectionsToInsert.length} sections for ${stadium.name}`);

            res.status(200).json({
                message: 'Stadium seeding completed successfully!',
                stadium: stadium,
                sectionsCount: sectionsToInsert.length,
                alreadyExists: false
            });

        } catch (error) {
            console.error('Error seeding stadium:', error);
            res.status(500).json({ 
                error: 'Failed to seed stadium data',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).json({ error: 'Method not allowed' });
    }
}

function getLevelColor(level: string): string {
    switch (level) {
        case 'upper': return '#424242';
        case 'club': return '#7B1FA2';
        case 'lower': return '#1976D2';
        default: return '#4A90E2';
    }
}

function calculateSectionPosition(sectionNumber: string, level: string) {
    const centerX = 400;
    const centerY = 300;
    
    let radius: number, innerRadius: number;
    
    switch (level) {
        case 'upper':
            radius = 280;
            innerRadius = 240;
            break;
        case 'club':
            radius = 220;
            innerRadius = 180;
            break;
        case 'lower':
            radius = 160;
            innerRadius = 120;
            break;
        default:
            radius = 160;
            innerRadius = 120;
    }
    
    const sectionNum = parseInt(sectionNumber);
    let baseAngle = 0;
    
    if (sectionNum >= 501 && sectionNum <= 550) {
        baseAngle = ((sectionNum - 501) / 49) * 270 - 135;
    } else if (sectionNum >= 301 && sectionNum <= 350) {
        baseAngle = ((sectionNum - 301) / 49) * 270 - 135;
    } else if (sectionNum >= 101 && sectionNum <= 150) {
        baseAngle = ((sectionNum - 101) / 49) * 270 - 135;
    } else if (sectionNum >= 201 && sectionNum <= 250) {
        baseAngle = ((sectionNum - 201) / 49) * 270 - 135 + 180;
    } else {
        baseAngle = 0;
    }
    
    const sectionWidth = 5.5;
    const angleStart = baseAngle - sectionWidth/2;
    const angleEnd = baseAngle + sectionWidth/2;
    
    const startAngleRad = (angleStart * Math.PI) / 180;
    const endAngleRad = (angleEnd * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    const x3 = centerX + innerRadius * Math.cos(endAngleRad);
    const y3 = centerY + innerRadius * Math.sin(endAngleRad);
    const x4 = centerX + innerRadius * Math.cos(startAngleRad);
    const y4 = centerY + innerRadius * Math.sin(startAngleRad);
    
    const largeArcFlag = angleEnd - angleStart <= 180 ? "0" : "1";
    
    const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
    
    return {
        path: path,
        center_x: centerX + ((radius + innerRadius) / 2) * Math.cos((startAngleRad + endAngleRad) / 2),
        center_y: centerY + ((radius + innerRadius) / 2) * Math.sin((startAngleRad + endAngleRad) / 2),
        angle: baseAngle
    };
}
