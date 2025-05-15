import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const users = [
    {
        email: 'test1@example.com',
        nickname: 'User1',
        password: 'password1',
        points: 1000,
    },
    {
        email: 'test2@example.com',
        nickname: 'User2',
        password: 'password2',
        points: 1500,
    },
    {
        email: 'test3@example.com',
        nickname: 'User3',
        password: 'password3',
        points: 2000,
    },
];

async function main() {
    for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await prisma.user.create({
            data: {
                email: user.email,
                nickname: user.nickname,
                encryptedPassword: hashedPassword,
                point: {
                    create: {
                        balance: user.points,
                    },
                },
            },
        });
        console.log(`✅ Created user: ${user.nickname}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
