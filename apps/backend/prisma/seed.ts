import { prisma } from "../src/lib/prisma";

async function main() {
    await prisma.role.createMany({
        data: [
            { name: "admin" },
            { name: "customer" }
        ],
        skipDuplicates: true
    });

    console.log("Roles seeded");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());