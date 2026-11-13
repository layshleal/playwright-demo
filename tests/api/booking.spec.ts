import { test, expect, type APIRequestContext } from '@playwright/test';

// Public practice API: https://restful-booker.herokuapp.com/apidoc/index.html
// Default admin credentials are published in the API docs; override them via env vars.
const API_USER = process.env.API_USER ?? 'admin';
const API_PASSWORD = process.env.API_PASSWORD ?? 'password123';

// The API is shared by everyone: a unique last name per run keeps our data apart.
const newBooking = {
  firstname: 'Helena',
  lastname: `Tester-${Date.now()}`,
  totalprice: 180,
  depositpaid: true,
  bookingdates: { checkin: '2026-12-01', checkout: '2026-12-05' },
  additionalneeds: 'Breakfast',
};

async function getToken(request: APIRequestContext): Promise<string> {
  const res = await request.post('/auth', {
    data: { username: API_USER, password: API_PASSWORD },
  });
  expect(res.ok()).toBeTruthy();
  const { token } = await res.json();
  expect(token).toBeTruthy();
  return token;
}

test.describe('Booking API', () => {
  test('health check responds @smoke', async ({ request }) => {
    const res = await request.get('/ping');
    expect(res.status()).toBe(201);
  });

  test('full CRUD lifecycle of a booking', async ({ request }) => {
    // Create
    const created = await request.post('/booking', { data: newBooking });
    expect(created.status()).toBe(200);
    const { bookingid, booking } = await created.json();
    expect(bookingid).toEqual(expect.any(Number));
    expect(booking).toMatchObject(newBooking);

    // Read
    const fetched = await request.get(`/booking/${bookingid}`);
    expect(fetched.status()).toBe(200);
    expect(await fetched.json()).toMatchObject(newBooking);

    // Update (partial, needs auth)
    const token = await getToken(request);
    const patched = await request.patch(`/booking/${bookingid}`, {
      headers: { Cookie: `token=${token}` },
      data: { totalprice: 200, additionalneeds: 'Late checkout' },
    });
    expect(patched.status()).toBe(200);
    expect(await patched.json()).toMatchObject({ totalprice: 200, additionalneeds: 'Late checkout' });

    // Delete
    const deleted = await request.delete(`/booking/${bookingid}`, {
      headers: { Cookie: `token=${token}` },
    });
    expect(deleted.status()).toBe(201);

    const gone = await request.get(`/booking/${bookingid}`);
    expect(gone.status()).toBe(404);
  });

  test('rejects update without a token', async ({ request }) => {
    const created = await request.post('/booking', { data: newBooking });
    const { bookingid } = await created.json();

    const res = await request.put(`/booking/${bookingid}`, { data: newBooking });
    expect(res.status()).toBe(403);
  });

  test('rejects invalid credentials', async ({ request }) => {
    const res = await request.post('/auth', {
      data: { username: API_USER, password: 'wrong' },
    });
    expect(await res.json()).toEqual({ reason: 'Bad credentials' });
  });

  test('filters bookings by name', async ({ request }) => {
    const created = await request.post('/booking', { data: newBooking });
    const { bookingid } = await created.json();

    const res = await request.get('/booking', {
      params: { firstname: newBooking.firstname, lastname: newBooking.lastname },
    });
    expect(res.status()).toBe(200);
    const ids = (await res.json()).map((b: { bookingid: number }) => b.bookingid);
    expect(ids).toContain(bookingid);
  });
});
