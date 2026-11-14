import { test, expect } from '../../fixtures/test';
import { type Booking, BookingSchema } from '../../schemas/booking';

/**
 * Control tests for the schema itself (no network).
 * A schema check that never fails proves nothing: each broken payload below must be rejected.
 */

const valid: Booking = {
  firstname: 'Ada',
  lastname: 'Lovelace',
  totalprice: 120,
  depositpaid: false,
  bookingdates: { checkin: '2026-12-01', checkout: '2026-12-03' },
  additionalneeds: 'Breakfast',
};

test.describe('Booking schema', () => {
  test('accepts a valid booking, with and without optional fields', () => {
    expect(valid).toMatchSchema(BookingSchema);

    const { additionalneeds: _omitted, ...withoutOptional } = valid;
    expect(withoutOptional).toMatchSchema(BookingSchema);
  });

  const broken: { name: string; payload: unknown }[] = [
    { name: 'missing required field', payload: { ...valid, lastname: undefined } },
    { name: 'price sent as a string', payload: { ...valid, totalprice: '120' } },
    { name: 'negative price', payload: { ...valid, totalprice: -1 } },
    { name: 'deposit as a string', payload: { ...valid, depositpaid: 'false' } },
    { name: 'date in a non-ISO format', payload: { ...valid, bookingdates: { ...valid.bookingdates, checkin: '01/12/2026' } } },
    { name: 'unexpected extra field', payload: { ...valid, internalNotes: 'leaked' } },
  ];

  for (const { name, payload } of broken) {
    test(`rejects a booking with ${name}`, () => {
      expect(payload).not.toMatchSchema(BookingSchema);
    });
  }
});
