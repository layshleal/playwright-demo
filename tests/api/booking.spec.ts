import { type APIRequestContext, type APIResponse } from '@playwright/test';
import { type z } from 'zod';
import { test, expect } from '../../fixtures/test';
import {
  AuthErrorSchema,
  AuthTokenSchema,
  type Booking,
  BookingIdListSchema,
  BookingSchema,
  CreateBookingResponseSchema,
} from '../../schemas/booking';

// Public practice API: https://restful-booker.herokuapp.com/apidoc/index.html
// Default admin credentials are published in the API docs; override them via env vars.
const API_USER = process.env.API_USER ?? 'admin';
const API_PASSWORD = process.env.API_PASSWORD ?? 'password123';

// The API is shared by everyone: a unique last name per run keeps our data apart.
const newBooking: Booking = {
  firstname: 'Helena',
  lastname: `Tester-${Date.now()}`,
  totalprice: 180,
  depositpaid: true,
  bookingdates: { checkin: '2026-12-01', checkout: '2026-12-05' },
  additionalneeds: 'Breakfast',
};

/** Asserts the response body matches the schema and returns it with the schema's type. */
async function bodyOf<S extends z.ZodType>(res: APIResponse, schema: S): Promise<z.infer<S>> {
  const json: unknown = await res.json();
  expect(json).toMatchSchema(schema);
  return schema.parse(json);
}

async function getToken(request: APIRequestContext): Promise<string> {
  const res = await request.post('/auth', {
    data: { username: API_USER, password: API_PASSWORD },
  });
  expect(res.ok()).toBeTruthy();
  const { token } = await bodyOf(res, AuthTokenSchema);
  return token;
}

test.describe('Booking API', () => {
  test('health check responds @smoke', async ({ request }) => {
    const res = await request.get('/ping');
    expect(res.status()).toBe(201);
  });

  test('full CRUD lifecycle of a booking', async ({ request }) => {
    // Create: contract first (shape and types), then the values we sent
    const created = await request.post('/booking', { data: newBooking });
    expect(created.status()).toBe(200);
    const { bookingid, booking } = await bodyOf(created, CreateBookingResponseSchema);
    expect(booking).toEqual(newBooking);

    // Read
    const fetched = await request.get(`/booking/${bookingid}`);
    expect(fetched.status()).toBe(200);
    expect(await bodyOf(fetched, BookingSchema)).toEqual(newBooking);

    // Update (partial, needs auth)
    const token = await getToken(request);
    const patched = await request.patch(`/booking/${bookingid}`, {
      headers: { Cookie: `token=${token}` },
      data: { totalprice: 200, additionalneeds: 'Late checkout' },
    });
    expect(patched.status()).toBe(200);
    expect(await bodyOf(patched, BookingSchema)).toEqual({ ...newBooking, totalprice: 200, additionalneeds: 'Late checkout' });

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
    expect(await bodyOf(res, AuthErrorSchema)).toEqual({ reason: 'Bad credentials' });
  });

  test('filters bookings by name', async ({ request }) => {
    const created = await request.post('/booking', { data: newBooking });
    const { bookingid } = await created.json();

    const res = await request.get('/booking', {
      params: { firstname: newBooking.firstname, lastname: newBooking.lastname },
    });
    expect(res.status()).toBe(200);
    const list = await bodyOf(res, BookingIdListSchema);
    expect(list.map((b) => b.bookingid)).toContain(bookingid);
  });
});
