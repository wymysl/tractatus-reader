# tractatus-push

One-time provisioning (requires `wrangler login`):

    cd push-worker
    npm install
    npx wrangler kv namespace create SUBS   # paste the id into wrangler.toml
    npx web-push generate-vapid-keys        # or any VAPID generator
    npx wrangler secret put VAPID_PUBLIC_KEY
    npx wrangler secret put VAPID_PRIVATE_KEY
    npx wrangler deploy

Then set `PUSH.workerUrl` (the deployed worker URL) and `PUSH.publicKey`
(the VAPID public key) in `site/app.js`, rebuild, and push. Test end-to-end
with one real subscription before announcing:

    npx wrangler dev --test-scheduled   # then: curl "http://localhost:8787/__scheduled"
