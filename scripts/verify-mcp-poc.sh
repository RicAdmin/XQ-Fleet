#!/usr/bin/env bash
# End-to-end MCP PoC acceptance script (#74).
# Equivalent to MCP Inspector: exercises search_available_cars → get_checkout_url
# against the public Streamable HTTP endpoint. Does not create a Rental.
set -euo pipefail

BASE_URL="${MCP_BASE_URL:-https://car.xqholidays.com.my}"
START_DATE="${MCP_START_DATE:-2026-08-15}"
END_DATE="${MCP_END_DATE:-2026-08-18}"

mcp_post() {
  curl -sfS "${BASE_URL}/api/mcp" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -H "mcp-protocol-version: 2025-03-26" \
    -d "$1"
}

parse_sse_json() {
  python3 -c "
import json, re, sys
text = sys.stdin.read()
m = re.search(r'data: (.+)', text)
if not m:
    raise SystemExit('No SSE data line in MCP response')
print(m.group(1))
"
}

echo "=== MCP PoC acceptance (#74) ==="
echo "Endpoint: ${BASE_URL}/api/mcp"
echo "Trip: ${START_DATE} → ${END_DATE}"
echo

echo "1. tools/list"
LIST=$(mcp_post '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | parse_sse_json)
echo "$LIST" | python3 -c "
import json, sys
d = json.load(sys.stdin)
names = [t['name'] for t in d['result']['tools']]
assert names == ['search_available_cars', 'get_checkout_url'], names
print('   tools:', ', '.join(names))
"

echo "2. search_available_cars"
SEARCH_RAW=$(mcp_post "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/call\",\"params\":{\"name\":\"search_available_cars\",\"arguments\":{\"startDate\":\"${START_DATE}\",\"endDate\":\"${END_DATE}\"}}}")
SEARCH=$(echo "$SEARCH_RAW" | parse_sse_json)
echo "$SEARCH" > /tmp/mcp-search.json
CAR_ID=$(python3 -c "
import json
d = json.load(open('/tmp/mcp-search.json'))
assert not d['result'].get('isError'), d['result']['content'][0]['text']
result = json.loads(d['result']['content'][0]['text'])
assert 'rentalId' not in result
cars = result['cars']
assert len(cars) > 0, result.get('message', 'no cars')
car = cars[0]
for key in ('id', 'displayName', 'dailyRateMyr', 'quoteEstimate'):
    assert key in car, car
assert 'estimate' in car['quoteEstimate']['disclaimer'].lower()
print(car['id'])
")
python3 -c "
import json
d = json.load(open('/tmp/mcp-search.json'))
result = json.loads(d['result']['content'][0]['text'])
car = result['cars'][0]
print(f\"   {result['message']}\")
print(f\"   first car: {car['displayName']} — RM {car['dailyRateMyr']}/day, est. RM {car['quoteEstimate']['estimatedTotalMyr']}\")
"

echo "3. get_checkout_url"
CHECKOUT_RAW=$(mcp_post "{\"jsonrpc\":\"2.0\",\"id\":3,\"method\":\"tools/call\",\"params\":{\"name\":\"get_checkout_url\",\"arguments\":{\"carId\":\"${CAR_ID}\",\"startDate\":\"${START_DATE}\",\"endDate\":\"${END_DATE}\",\"from\":\"lgk-airport\",\"pickTime\":\"10:00\",\"adults\":2}}}")
CHECKOUT=$(echo "$CHECKOUT_RAW" | parse_sse_json)
CHECKOUT_URL=$(echo "$CHECKOUT" | python3 -c "
import json, sys
d = json.load(sys.stdin)
assert not d['result'].get('isError'), d['result']['content'][0]['text']
result = json.loads(d['result']['content'][0]['text'])
url = result['checkoutUrl']
assert '/en/checkout/' in url
assert 'startDate=' in url and 'endDate=' in url
assert 'rentalId' not in result
print(url)
")

echo "   checkout URL: ${CHECKOUT_URL}"
echo
echo "✅ MCP inspector-equivalent handoff succeeded."
echo "   Open the Checkout URL in a browser to confirm Trip dates are prefilled."
echo "   No Rental is created by these tool calls (read-only handoff)."
