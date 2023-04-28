# Slashing Guard

A slashing guard for LIDO node operators.

![Slashing Guard Flow](slashing-guard-flow.png)

# Build and run your image

### give your docker image a name
```bash 
docker build -t image_name .
```

### for example
```bash
docker build -t slashing_guard .
```

```BASH
docker run --env-file .env slashing_guard
```