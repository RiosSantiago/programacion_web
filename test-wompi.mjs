// Quick test: does the Wompi sandbox API accept our key?
async function test() {
  const res = await fetch('https://sandbox.wompi.co/v1/payment_links', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer prv_test_WsMSikmUmG6fUAgu43WAk1hMq9427h3o',
    },
    body: JSON.stringify({
      name: 'Pedido AG-TEST-001',
      description: 'Compra en Agroup - 1 producto(s)',
      single_use: true,
      amount_in_cents: 5000000,
      currency: 'COP',
      collect_shipping: false,
      redirect_url: 'http://localhost:4321/pedido-exito?orden=AG-TEST-001&metodo=pse',
    }),
  });
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(data, null, 2));

  if (data.data?.id) {
    const checkoutUrl = `https://checkout.wompi.co/l/${data.data.id}`;
    console.log('\n✓ LINK DE PAGO:', checkoutUrl);
  }
}
test();
