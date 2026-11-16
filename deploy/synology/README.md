# Synology deployment

Runs the app in Container Manager next to a Tailscale container, which joins your tailnet as a device named `todo`. The app is then reachable at `http://todo` and `https://todo.<tailnet>.ts.net` from devices on the tailnet, and from nowhere else. It uses no ports on the NAS.

## First setup

1. In the Tailscale admin console, create an auth key under Settings → Keys. Make it one-off with a 1 day expiry, and leave "Ephemeral" off.
2. For the HTTPS address, turn on HTTPS Certificates on the DNS page of the admin console. `http://todo` works without it, but the app only installs to the home screen (PWA) over HTTPS.
3. From this repo, copy the source and these files to the NAS:
   ```
   deploy/synology/push-source.sh Matt@nas-address
   ```
   This creates `/volume1/docker/tasks-md` with `src/`, `tasks/`, `config/`, `tailscale/`, `docker-compose.yml` and `serve.json`.
4. Edit `/volume1/docker/tasks-md/docker-compose.yml` on the NAS and replace `tskey-auth-REPLACE-ME` with the key.
5. In Container Manager, go to Project → Create, set the path to `/volume1/docker/tasks-md`, choose "Use existing docker-compose.yml", and finish. The first build takes a few minutes, and the app builds its frontend again on each start, so give it another minute before opening it.
6. Once `todo` shows up in the Tailscale admin console, delete the key from `docker-compose.yml`. In the console, you can also disable key expiry for `todo` so it doesn't drop off the tailnet after 180 days.

## Updating

Commit your changes, run `push-source.sh` again (it keeps your `docker-compose.yml`), then in Container Manager select the project, stop it, and choose Action → Build.

## Limiting who can open it

The app has no login, so every device on the tailnet can open it. To limit it to your own devices, tag the node (for example `tag:todo`) and add an access rule in the tailnet policy that only lets your user reach `tag:todo`.
