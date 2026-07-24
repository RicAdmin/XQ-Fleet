# XQ Car Fleet

Langkawi car rental: customers choose a car and trip, then complete payment on the site. Agents may assist discovery and hand off to human checkout; they do not settle payment.

## Language

**Trip**:
The intended pickup and return window (and optional meet points/times) for a car hire.
_Avoid_: Search criteria, booking state (when meaning the trip itself)

**Available car**:
A fleet unit that can be offered for a Trip: marked available and not blocked by an overlapping pending or active Rental.
_Avoid_: In stock, free car

**Rental**:
The persisted reservation of a car for a Trip after the customer commits through checkout (or staff create one).
_Avoid_: Order, booking (when meaning the database reservation), MCP booking

**Checkout**:
The human web flow where the customer confirms Trip details, identity, and payment for a chosen car.
_Avoid_: Agent booking, place booking (when an agent only returns a link)

**Checkout URL**:
A deep link into Checkout for a specific car and Trip. Opening it does not create a Rental by itself.
_Avoid_: Booking link, payment link (unless payment is already completed)

**Agent checkout handoff**:
An agent helps the customer find an Available car and returns a Checkout URL; the customer completes Checkout. No Rental is created by the agent.
_Avoid_: Place a booking, agent booking, book via ChatGPT (when no Rental exists yet)

**Quote estimate**:
A non-binding money figure shown before Checkout (for example daily rate × nights). The Checkout total is authoritative.
_Avoid_: Price, total, invoice
