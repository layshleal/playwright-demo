import { test, expect } from '../../fixtures/test';
import { CreateBookingResponseSchema } from '../../schemas/booking';

/**
 * Negative cases: how the API behaves when the client gets it wrong.
 *
 * Some responses are not what a well-behaved API should return. Those tests assert the
 * CURRENT behaviour (characterization tests) and carry a "known-api-defect" annotation, visible
 * in the HTML report. If the API is ever fixed, the test fails and points at what changed.
 * test.fail() is not used on purpose: it would also turn timeouts or network errors green.
 */

const knownDefect = (description: string) => test.info().annotations.push({ type: 'known-api-defect', description });

const validDates = { checkin: '2026-12-01', checkout: '2026-12-03' };

test.describe('Booking API – negative cases', () => {
  test('unknown booking id returns 404', async ({ request }) => {
    const res = await request.get('/booking/999999999');
    expect(res.status()).toBe(404);
  });

  test('non-numeric booking id returns 404', async ({ request }) => {
    const res = await request.get('/booking/abc');
    expect(res.status()).toBe(404);
  });

  test('malformed JSON body returns 400', async ({ request }) => {
    const res = await request.post('/booking', {
      headers: { 'Content-Type': 'application/json' },
      data: '{ "firstname": "Ada", ', // truncated JSON
    });
    expect(res.status()).toBe(400);
  });

  test('delete without a token is rejected with 403', async ({ request }) => {
    const res = await request.delete('/booking/1');
    expect(res.status()).toBe(403);
  });

  test('booking without required fields returns 500 (known defect: should be 400)', async ({ request }) => {
    knownDefect('Missing required fields cause a server error (500) instead of a validation error (400).');

    const res = await request.post('/booking', { data: {} });
    expect(res.status()).toBe(500);
  });

  test('price sent as text is accepted and stored as null (known defect: should be 400)', async ({ request }) => {
    knownDefect('An invalid totalprice is accepted with 200 and silently stored as null instead of being rejected.');

    const res = await request.post('/booking', {
      data: {
        firstname: 'Ada',
        lastname: `Negative-${Date.now()}`,
        totalprice: 'cheap',
        depositpaid: true,
        bookingdates: validDates,
      },
    });

    expect(res.status()).toBe(200);
    const body: unknown = await res.json();
    expect(body).toMatchObject({ booking: { totalprice: null } });
    // our contract test would have caught it: the stored booking breaks the schema
    expect(body).not.toMatchSchema(CreateBookingResponseSchema);
  });

  test('wrong credentials return 200 with a reason (known defect: should be 401)', async ({ request }) => {
    knownDefect('Failed authentication answers 200 OK with a body, instead of 401 Unauthorized.');

    const res = await request.post('/auth', { data: { username: 'admin', password: 'wrong' } });
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ reason: 'Bad credentials' });
  });
});
