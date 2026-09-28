import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const tasks = [
  // Errands & Daily Tasks
  { category: "Errands & Daily Tasks", name: "Pickups & Deliveries", description: "Parcels, documents and items collected or dropped off." },
  { category: "Errands & Daily Tasks", name: "Payments & Renewals", description: "Bills, subscriptions and renewals paid on time." },
  { category: "Errands & Daily Tasks", name: "Documents & Government", description: "Certificates, registrations and government office work." },
  { category: "Errands & Daily Tasks", name: "Shopping", description: "Groceries and household shopping done for you." },

  // Home Services
  { category: "Home Services", name: "AC service & repair", description: "Cleaning, gas refills and repairs for your ACs." },
  { category: "Home Services", name: "Plumbing", description: "Leaks, taps, drains and water heaters fixed." },
  { category: "Home Services", name: "Electrical", description: "Switches, fans, lights and wiring issues sorted." },
  { category: "Home Services", name: "Deep cleaning", description: "Top-to-bottom cleaning of your home." },
  { category: "Home Services", name: "Repairs & carpentry", description: "Furniture, doors and fittings repaired." },

  // Travel & Tourism
  { category: "Travel & Tourism", name: "Flights", description: "Search, book and manage flight tickets." },
  { category: "Travel & Tourism", name: "Hotels", description: "Stays that fit your budget and plans." },
  { category: "Travel & Tourism", name: "Visas", description: "Visa paperwork and appointments handled." },
  { category: "Travel & Tourism", name: "Airport transfers", description: "Cabs to and from the airport, booked ahead." },
  { category: "Travel & Tourism", name: "Itinerary planning", description: "Day-by-day trip plans made for your family." },

  // Health & Medical
  { category: "Health & Medical", name: "Doctor appointments", description: "Consultations booked and reminded." },
  { category: "Health & Medical", name: "Lab tests at home", description: "Home sample collection scheduled." },
  { category: "Health & Medical", name: "Medicine delivery", description: "Prescriptions picked up and delivered." },
  { category: "Health & Medical", name: "Hospital support", description: "Admissions, discharge and insurance paperwork." },

  // Senior Care
  { category: "Senior Care", name: "Regular check-ins", description: "Someone checks on your parents regularly." },
  { category: "Senior Care", name: "Caregiver arrangement", description: "Find and verify a trained caregiver." },
  { category: "Senior Care", name: "Doctor visit escort", description: "Accompanied trips to doctors and hospitals." },
  { category: "Senior Care", name: "Emergency support", description: "Quick help when something goes wrong." },

  // Events & Management
  { category: "Events & Management", name: "Birthday parties", description: "Venue, cake, decor and guests sorted." },
  { category: "Events & Management", name: "Poojas & functions", description: "Priest, samagri and arrangements handled." },
  { category: "Events & Management", name: "Catering", description: "Food for gatherings of any size." },
  { category: "Events & Management", name: "Decor & venue", description: "Decoration and venue booking." },
];

async function main() {
  const count = await prisma.task.count();
  if (count > 0) {
    console.log(`Tasks already seeded (${count}), skipping.`);
    return;
  }
  await prisma.task.createMany({ data: tasks });
  console.log(`Seeded ${tasks.length} tasks.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
