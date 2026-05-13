export default async function (req) {
  return new Response(
    JSON.stringify({ status: 'OK' }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
