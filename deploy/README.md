# Deploy TrainWithGouli

This application shares the dev server with ManakeeshHub via the shared nginx gateway at `~/workspace/nginx-gateway/`.

## Dev Server Access

- Tailscale IP: `100.73.187.82`
- Dev domain: `https://trainwithgouli.mzm.co.in`
- Server SSH: `ssh dev`

## Architecture

The application containers connect to the external `trainwithgouli` Podman network. The shared nginx gateway routes `trainwithgouli.mzm.co.in` traffic to these containers.

**Important:** This application must **not** bind ports 80 or 443. Only the shared gateway binds those ports.

## Deployment

```bash
# 1. Build and push images
# (Add your build commands here)

# 2. Deploy to dev server
cd deploy
VERSION=0.1.0 podman-compose up -d

# Or via Ansible when a playbook is available
# ansible-playbook -i ../infra/ansible/inventory/dev.yml ../infra/ansible/playbooks/deploy.yml
```

## Enabling Gateway Routing

Once the application containers are running on the `trainwithgouli` network, enable the gateway config:

```bash
ssh dev
mv /opt/nginx-gateway/env/dev/disabled/trainwithgouli.conf \
   /opt/nginx-gateway/env/dev/conf.d/
cd /opt/nginx-gateway
ENV=dev podman-compose restart
```

## Network

The `trainwithgouli` Podman network must already exist on the dev server. If it does not:

```bash
ssh dev
podman network create trainwithgouli
```

## Files

- `deploy/docker-compose.yml` - Application containers (no nginx, no port 80/443 binding)
