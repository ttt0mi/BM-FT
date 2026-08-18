import { prisma } from '../src/lib/prisma.js';

// AI generated categories
// System-level categories seeded once. The categories module
// will let users create their own custom categories on top of these.
const SYSTEM_CATEGORIES = [
    { name: 'Food & Dining', icon: '🍽️' },
    { name: 'Transport', icon: '🚗' },
    { name: 'Housing', icon: '🏠' },
    { name: 'Utilities', icon: '💡' },
    { name: 'Healthcare', icon: '⚕️' },
    { name: 'Education', icon: '📚' },
    { name: 'Entertainment', icon: '🎬' },
    { name: 'Shopping', icon: '🛍️' },
    { name: 'Salary', icon: '💰' },
    { name: 'Freelance', icon: '💼' },
    { name: 'Investment', icon: '📈' },
    { name: 'Savings', icon: '🏦' },
    { name: 'Transfer', icon: '🔁' },
    { name: 'Other', icon: '📦' },
];

async function main(): Promise<void> {
    console.info('Seeding categories...');

    for (const category of SYSTEM_CATEGORIES) {
        await prisma.category.upsert({
            where: { name: category.name },
            update: {},
            create: category,
        });
    }

    console.info(`Seeded ${SYSTEM_CATEGORIES.length} categories.`);
}

main()
    .catch(async (error: unknown) => {
        console.error('Seed failed:', error);
        process.exit(1);
    })
    .finally(() => {
        void prisma.$disconnect();
    });
