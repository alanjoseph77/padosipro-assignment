import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const tasks = [
  // Home Maintenance
  { category: "Home Maintenance", name: "Plumbing repairs", description: "Fix leaks, taps, blocked drains and water heaters." },
  { category: "Home Maintenance", name: "Electrical repairs", description: "Switches, fans, lights and wiring issues sorted by a verified electrician." },
  { category: "Home Maintenance", name: "Carpentry work", description: "Repair furniture, doors, cabinets and fittings." },
  { category: "Home Maintenance", name: "AC servicing", description: "Routine AC cleaning, gas refills and repairs." },

  // Cleaning & Housekeeping
  { category: "Cleaning & Housekeeping", name: "Deep home cleaning", description: "Top-to-bottom cleaning of every room, kitchen and bathroom." },
  { category: "Cleaning & Housekeeping", name: "Sofa & carpet cleaning", description: "Shampoo and vacuum sofas, carpets and mattresses." },
  { category: "Cleaning & Housekeeping", name: "Pest control", description: "Treatment for cockroaches, termites, mosquitoes and more." },
  { category: "Cleaning & Housekeeping", name: "Find domestic help", description: "Hire and verify a maid, cook or housekeeper." },

  // Errands & Deliveries
  { category: "Errands & Deliveries", name: "Grocery shopping", description: "Weekly groceries bought and delivered to your door." },
  { category: "Errands & Deliveries", name: "Medicine pickup", description: "Collect prescriptions from the pharmacy." },
  { category: "Errands & Deliveries", name: "Courier & parcels", description: "Send, receive and track parcels and documents." },
  { category: "Errands & Deliveries", name: "Laundry & dry cleaning", description: "Pickup, wash, iron and drop-off of clothes." },

  // Bills & Payments
  { category: "Bills & Payments", name: "Utility bill payments", description: "Electricity, water and gas bills paid on time." },
  { category: "Bills & Payments", name: "Mobile & internet recharge", description: "Keep phone, broadband and DTH plans active." },
  { category: "Bills & Payments", name: "Property tax filing", description: "Calculate and pay municipal property tax." },
  { category: "Bills & Payments", name: "Insurance renewals", description: "Track and renew health, vehicle and home insurance." },

  // Health & Wellness
  { category: "Health & Wellness", name: "Doctor appointments", description: "Book and remind you about consultations." },
  { category: "Health & Wellness", name: "Lab tests at home", description: "Schedule home sample collection for blood tests." },
  { category: "Health & Wellness", name: "Elderly care support", description: "Regular check-ins and help for elderly family members." },
  { category: "Health & Wellness", name: "Fitness trainer", description: "Find a personal trainer or yoga instructor." },

  // Travel & Bookings
  { category: "Travel & Bookings", name: "Train & flight tickets", description: "Search, book and manage travel tickets." },
  { category: "Travel & Bookings", name: "Hotel bookings", description: "Find and reserve stays that fit your budget." },
  { category: "Travel & Bookings", name: "Cab arrangements", description: "Airport drops and outstation cabs booked in advance." },
  { category: "Travel & Bookings", name: "Passport & visa help", description: "Paperwork and appointments for passports and visas." },
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