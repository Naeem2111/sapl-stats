const { prisma } = require('./src/database/prisma');

async function checkData() {
    try {
        const [seasons, teams, competitions, matches] = await Promise.all([
            prisma.season.count(),
            prisma.team.count(),
            prisma.competition.count(),
            prisma.match.count()
        ]);
        
        console.log('Database counts:');
        console.log('- Seasons:', seasons);
        console.log('- Teams:', teams);
        console.log('- Competitions:', competitions);
        console.log('- Matches:', matches);
        
        if (seasons > 0) {
            const seasonData = await prisma.season.findMany({ take: 3 });
            console.log('\nSample seasons:', seasonData.map(s => s.name));
        }
        
        if (teams > 0) {
            const teamData = await prisma.team.findMany({ take: 5 });
            console.log('\nSample teams:', teamData.map(t => t.name));
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();

