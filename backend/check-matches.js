const { prisma } = require('./src/database/prisma');

async function checkMatches() {
    try {
        const count = await prisma.match.count();
        console.log('Total matches:', count);
        
        if (count > 0) {
            const matches = await prisma.match.findMany({
                take: 5,
                include: {
                    homeTeam: { select: { name: true } },
                    awayTeam: { select: { name: true } },
                    season: { select: { name: true } }
                }
            });
            
            console.log('\nSample matches:');
            matches.forEach(match => {
                console.log(`${match.homeTeam.name} vs ${match.awayTeam.name} - ${match.status} - ${match.homeScore || 0}:${match.awayScore || 0}`);
            });
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkMatches();

