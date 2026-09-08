variable "IMAGE" {
  type = string
}

variable "POSTGRES_IMAGE" {
  type = string
}

variable "DB_USER" {
  type = string
}

variable "DB_PASSWORD" {
  type = string
}

variable "DB_NAME" {
  type = string
}

variable "DB_PORT" {
  type = string
}

variable "SECRET_KEY" {
  type = string
}

variable "EMAIL_HOST" {
  type = string
}

variable "EMAIL_PORT" {
  type = string
}

variable "EMAIL_USE_SSL" {
  type = string
}

variable "EMAIL_USE_TLS" {
  type = string
}

variable "EMAIL_HOST_USER" {
  type = string
}

variable "EMAIL_HOST_PASSWORD" {
  type = string
}

variable "MAIL_DEFAULT_SENDER" {
  type = string
}

variable "CLOUDFLARE_TUNNEL_TOKEN" {
  type = string
}


job "nextmailer" {
  namespace   = "prod"
  datacenters = ["dc1"]
  type        = "service"

  # ===============================================================
  # PostgreSQL
  # ===============================================================

  group "database" {
    count = 1

    network {
      mode = "bridge"
    }

    service {
      name         = "nextmailer-db"
      port         = 5432
      provider     = "nomad"
      address_mode = "alloc"

      check {
        type         = "tcp"
        port         = 5432
        interval     = "10s"
        timeout      = "3s"
        address_mode = "alloc"
      }
    }

    task "postgres" {
      driver = "podman"

      config {
        image = var.POSTGRES_IMAGE
      }

      env {
        POSTGRES_USER     = var.DB_USER
        POSTGRES_PASSWORD = var.DB_PASSWORD
        POSTGRES_DB       = var.DB_NAME
      }

      resources {
        cpu    = 500
        memory = 1024
      }

      restart {
        attempts = 5
        interval = "30m"
        delay    = "15s"
        mode     = "delay"
      }
    }
  }


  # ===============================================================
  # NextMailer Application
  # ===============================================================

  group "application" {
    count = 1

    network {
      mode = "bridge"

      port "http" {
        to = 5000
      }
    }

    service {
      name         = "nextmailer"
      port         = "http"
      provider     = "nomad"
      address_mode = "alloc"

      check {
        type         = "http"
        path         = "/"
        port         = "http"
        interval     = "10s"
        timeout      = "5s"
        address_mode = "alloc"
      }
    }

    task "web" {
      driver = "podman"

      config {
        image = var.IMAGE
      }

      env {
        DB_HOST     = "nextmailer-db"
        DB_PORT     = var.DB_PORT
        DB_NAME     = var.DB_NAME
        DB_USER     = var.DB_USER
        DB_PASSWORD = var.DB_PASSWORD

        SECRET_KEY = var.SECRET_KEY

        DEBUG     = "False"
        FLASK_ENV = "production"

        EMAIL_HOST          = var.EMAIL_HOST
        EMAIL_PORT          = var.EMAIL_PORT
        EMAIL_USE_SSL       = var.EMAIL_USE_SSL
        EMAIL_USE_TLS       = var.EMAIL_USE_TLS
        EMAIL_HOST_USER     = var.EMAIL_HOST_USER
        EMAIL_HOST_PASSWORD = var.EMAIL_HOST_PASSWORD

        MAIL_DEFAULT_SENDER = var.MAIL_DEFAULT_SENDER
      }

      resources {
        cpu    = 500
        memory = 512
      }

      restart {
        attempts = 5
        interval = "30m"
        delay    = "15s"
        mode     = "delay"
      }
    }
  }


  # ===============================================================
  # Cloudflare Tunnel
  # ===============================================================

  group "cloudflare" {
    count = 1

    network {
      mode = "bridge"
    }

     task "traefik" {
      driver = "podman"

      config {
        image = "docker.io/library/traefik:v3.1"
        args = [
          "--entrypoints.web.address=:80",
          "--providers.file.filename=/local/dynamic.yml",
          "--providers.file.watch=true",
          "--log.level=INFO",
        ]
      }

      # Renders the full list of healthy frontend replicas into a
      # Traefik dynamic config file. Re-renders automatically whenever
      # instances are added/removed/rescheduled; Traefik's file
      # provider watch picks up the change live, no restart needed.
      template {
        data        = <<EOF
http:
  routers:
    nextmailer:
      rule: "PathPrefix(`/`)"
      entryPoints:
        - web
      service: nextmailer
  services:
    nextmailer:
      loadBalancer:
        servers:
{{ range nomadService "nextmailer" }}
          - url: "http://{{ .Address }}:{{ .Port }}"
{{ end }}
EOF
        destination = "local/dynamic.yml"
      }

      resources {
        cpu    = 100
        memory = 128
      }
    }
    
    task "cloudflared" {
      driver = "podman"

      config {
        image = "docker.io/cloudflare/cloudflared:latest"

        args = [
          "tunnel",
          "--no-autoupdate",
          "run",
          "--token",
          var.CLOUDFLARE_TUNNEL_TOKEN
        ]
      }

      resources {
        cpu    = 100
        memory = 128
      }

      restart {
        attempts = 10
        interval = "30m"
        delay    = "15s"
        mode     = "delay"
      }
    }
  }
}