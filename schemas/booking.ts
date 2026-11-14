import { z } from 'zod';

// Response contracts of the Restful Booker API (https://restful-booker.herokuapp.com/apidoc/index.html).
// Strict objects: an unexpected extra field fails the test, so contract changes are noticed.

export const BookingDatesSchema = z.strictObject({
  checkin: z.iso.date(), // YYYY-MM-DD
  checkout: z.iso.date(),
});

export const BookingSchema = z.strictObject({
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  totalprice: z.number().int().nonnegative(),
  depositpaid: z.boolean(),
  bookingdates: BookingDatesSchema,
  additionalneeds: z.string().optional(),
});

export const CreateBookingResponseSchema = z.strictObject({
  bookingid: z.number().int().positive(),
  booking: BookingSchema,
});

export const BookingIdListSchema = z.array(z.strictObject({ bookingid: z.number().int().positive() }));

export const AuthTokenSchema = z.strictObject({ token: z.string().min(1) });

export const AuthErrorSchema = z.strictObject({ reason: z.string().min(1) });

/** TypeScript type derived from the schema: one source of truth for data and types. */
export type Booking = z.infer<typeof BookingSchema>;
