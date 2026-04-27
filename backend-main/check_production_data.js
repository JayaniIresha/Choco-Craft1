const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const recipes = await prisma.recipe.findMany();
  const materials = await prisma.material.findMany();
  console.log('--- RECIPES ---');
  recipes.forEach(r => console.log(`${r.id}: ${r.name}`));
  console.log('--- MATERIALS ---');
  materials.forEach(m => console.log(`${m.id}: ${m.name} (Qty: ${m.quantity}, Min: ${m.minimumLevel})`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
