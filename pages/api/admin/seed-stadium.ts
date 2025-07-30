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
    const centerX = 500;
    const centerY = 300;
    
    let ovalWidth: number, ovalHeight: number, thickness: number;
    
    switch (level) {
        case 'upper':
            ovalWidth = 400;
            ovalHeight = 280;
            thickness = 35;
            break;
        case 'club':
            ovalWidth = 320;
            ovalHeight = 220;
            thickness = 35;
            break;
        case 'lower':
            ovalWidth = 240;
            ovalHeight = 160;
            thickness = 35;
            break;
        default:
            ovalWidth = 240;
            ovalHeight = 160;
            thickness = 35;
    }
    
    const innerOvalWidth = ovalWidth - thickness;
    const innerOvalHeight = ovalHeight - thickness;
    
    const sectionNum = parseInt(sectionNumber);
    let normalizedPosition = 0;
    
    if (sectionNum >= 501 && sectionNum <= 554) {
        normalizedPosition = (sectionNum - 501) / 53;
    } else if (sectionNum >= 301 && sectionNum <= 350) {
        normalizedPosition = (sectionNum - 301) / 49;
    } else if (sectionNum >= 101 && sectionNum <= 150) {
        normalizedPosition = (sectionNum - 101) / 49;
    } else if (sectionNum >= 201 && sectionNum <= 256) {
        normalizedPosition = (sectionNum - 201) / 55;
    } else if (sectionNum >= 131 && sectionNum <= 150) {
        normalizedPosition = (sectionNum - 131) / 19;
    } else {
        normalizedPosition = 0;
    }
    
    const angle = normalizedPosition * 2 * Math.PI;
    
    const outerX = centerX + ovalWidth * Math.cos(angle);
    const outerY = centerY + ovalHeight * Math.sin(angle);
    const innerX = centerX + innerOvalWidth * Math.cos(angle);
    const innerY = centerY + innerOvalHeight * Math.sin(angle);
    
    const sectionArcLength = 0.12;
    const startAngle = angle - sectionArcLength / 2;
    const endAngle = angle + sectionArcLength / 2;
    
    const x1 = centerX + ovalWidth * Math.cos(startAngle);
    const y1 = centerY + ovalHeight * Math.sin(startAngle);
    const x2 = centerX + ovalWidth * Math.cos(endAngle);
    const y2 = centerY + ovalHeight * Math.sin(endAngle);
    const x3 = centerX + innerOvalWidth * Math.cos(endAngle);
    const y3 = centerY + innerOvalHeight * Math.sin(endAngle);
    const x4 = centerX + innerOvalWidth * Math.cos(startAngle);
    const y4 = centerY + innerOvalHeight * Math.sin(startAngle);
    
    const largeArcFlag = sectionArcLength <= Math.PI ? "0" : "1";
    
    const path = `M ${x1} ${y1} A ${ovalWidth} ${ovalHeight} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerOvalWidth} ${innerOvalHeight} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
    
    return {
        path: path,
        center_x: centerX + ((ovalWidth + innerOvalWidth) / 2) * Math.cos(angle),
        center_y: centerY + ((ovalHeight + innerOvalHeight) / 2) * Math.sin(angle),
        angle: angle * 180 / Math.PI
    };
}
