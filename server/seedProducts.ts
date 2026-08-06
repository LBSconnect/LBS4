import { getUncachableStripeClient } from './stripeClient';

export async function seedStripeProducts() {
  const stripe = await getUncachableStripeClient();

  const productsToCreate = [
    {
      name: 'Notary Service',
      description: 'Certified notary public services for documents, affidavits, and legal papers. Per document rate.',
      metadata: { category: 'notary', slug: 'notary-service' },
      priceAmount: 1000, // $10.00
    },
    {
      name: 'Passport Photos',
      description: 'Professional passport and visa photos meeting all government standards. Includes 2 printed photos.',
      metadata: { category: 'passport', slug: 'passport-photos' },
      priceAmount: 2500, // $25.00
    },
    {
      name: 'Certiport Exam Testing',
      description: 'Professional exam testing environment for IT certifications including Pearson VUE, Certiport, and PMI exams.',
      metadata: { category: 'certification', slug: 'certification-exam-testing' },
      priceAmount: 3500, // $35.00
    },
    // Boot camps are pay-online-only (server/routes.ts's isBootcampService gate
    // requires payment to book) but — unlike the three services above — had no
    // entry here, so nothing ever provisioned or self-healed their Stripe
    // product/price. If it was ever missing (as found while auditing: this
    // account had none), checkout silently breaks for every Boot Camp booking
    // with no operator alert. Prices match the existing $99 rate already
    // displayed everywhere (client/src/lib/services.ts) — not a price change.
    {
      name: 'Texas Life Insurance Exam Boot Camp',
      description: 'Intensive Saturday morning Boot Camp for the Texas Life Insurance license exam, 8:00 AM – 10:00 AM.',
      metadata: { category: 'bootcamp', slug: 'life-insurance-boot-camp' },
      priceAmount: 9900, // $99.00
    },
    {
      name: 'Texas Property & Casualty Exam Boot Camp',
      description: 'Intensive Saturday morning Boot Camp for the Texas Property & Casualty insurance license exam, 10:30 AM – 12:30 PM.',
      metadata: { category: 'bootcamp', slug: 'property-casualty-boot-camp' },
      priceAmount: 9900, // $99.00
    },
  ];

  for (const productData of productsToCreate) {
    try {
      const existingProducts = await stripe.products.search({
        query: `name:'${productData.name}'`,
      });

      let productId: string;

      if (existingProducts.data.length > 0) {
        productId = existingProducts.data[0].id;

        const prices = await stripe.prices.list({ product: productId, active: true });
        const correctPrice = prices.data.find(p => p.unit_amount === productData.priceAmount);

        if (correctPrice) {
          console.log(`Product "${productData.name}" already exists with correct price, skipping.`);
          continue;
        }

        for (const oldPrice of prices.data) {
          if (oldPrice.unit_amount !== productData.priceAmount) {
            await stripe.prices.update(oldPrice.id, { active: false });
          }
        }

        await stripe.prices.create({
          product: productId,
          unit_amount: productData.priceAmount,
          currency: 'usd',
        });

        console.log(`Updated price for "${productData.name}" to $${(productData.priceAmount / 100).toFixed(2)}`);
      } else {
        const product = await stripe.products.create({
          name: productData.name,
          description: productData.description,
          metadata: productData.metadata,
        });

        await stripe.prices.create({
          product: product.id,
          unit_amount: productData.priceAmount,
          currency: 'usd',
        });

        console.log(`Created product: ${productData.name} ($${(productData.priceAmount / 100).toFixed(2)})`);
      }
    } catch (error: any) {
      console.error(`Error creating product "${productData.name}":`, error.message);
    }
  }
}
