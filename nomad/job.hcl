variable "BACKEND_IMAGE" {
  type = string
}

variable "BACKEND_UI_IMAGE" {
  type = string
}

variable "MIGRATE_IMAGE" {
  type = string
}

variable "POSTGRES_IMAGE" {
  type = string
}

variable "AZURITE_IMAGE" {
  type = string
}

variable "MAILPIT_IMAGE" {
  type = string
}

variable "STRIPE_MOCK_IMAGE" {
  type = string
}


job "redaxify" {
  namespace   = "dev"
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
      name         = "redaxify-db"
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
        POSTGRES_USER     = "postgres"
        POSTGRES_PASSWORD = "postgres"
        POSTGRES_DB       = "redaxify"
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
  # Database Migration
  # ===============================================================

  group "migration" {
    count = 1

    network {
      mode = "bridge"
    }

    task "migrate" {
      driver = "podman"

      config {
        image = var.MIGRATE_IMAGE
      }

      env {
        DB_HOST     = "redaxify-db"
        DB_PORT     = "5432"
        DB_NAME     = "redaxify"
        DB_USER     = "postgres"
        DB_PASSWORD = "postgres"
      }

      resources {
        cpu    = 500
        memory = 512
      }

      restart {
        attempts = 3
        interval = "30m"
        delay    = "15s"
        mode     = "delay"
      }
    }
  }


  # ===============================================================
  # Backend
  # ===============================================================

  group "backend" {
    count = 1

    network {
      mode = "bridge"

      port "http" {
        to = 5000
      }
    }

    service {
      name         = "redaxify-backend"
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

    task "backend" {
      driver = "podman"

      config {
        image = var.BACKEND_IMAGE
      }

      env {
        DB_HOST     = "redaxify-db"
        DB_PORT     = "5432"
        DB_NAME     = "redaxify"
        DB_USER     = "postgres"
        DB_PASSWORD = "postgres"
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
  # Backend UI
  # ===============================================================

  group "backend-ui" {
    count = 1

    network {
      mode = "bridge"

      port "http" {
        to = 3000
      }
    }

    service {
      name         = "redaxify-backend-ui"
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

    task "ui" {
      driver = "podman"

      config {
        image = var.BACKEND_UI_IMAGE
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
  # Azurite
  # ===============================================================

  group "azurite" {
    count = 1

    network {
      mode = "bridge"

      port "blob" {
        to = 10000
      }

      port "queue" {
        to = 10001
      }

      port "table" {
        to = 10002
      }
    }

    service {
      name         = "redaxify-azurite"
      port         = "blob"
      provider     = "nomad"
      address_mode = "alloc"

      check {
        type         = "tcp"
        port         = "blob"
        interval     = "10s"
        timeout      = "3s"
        address_mode = "alloc"
      }
    }

    task "azurite" {
      driver = "podman"

      config {
        image = var.AZURITE_IMAGE

        args = [
          "azurite",
          "--blobHost",
          "0.0.0.0",
          "--queueHost",
          "0.0.0.0",
          "--tableHost",
          "0.0.0.0"
        ]
      }

      resources {
        cpu    = 300
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
  # Mailpit
  # ===============================================================

  group "mailpit" {
    count = 1

    network {
      mode = "bridge"

      port "smtp" {
        to = 1025
      }

      port "http" {
        to = 8025
      }
    }

    service {
      name         = "redaxify-mailpit"
      port         = "smtp"
      provider     = "nomad"
      address_mode = "alloc"

      check {
        type         = "tcp"
        port         = "smtp"
        interval     = "10s"
        timeout      = "3s"
        address_mode = "alloc"
      }
    }

    task "mailpit" {
      driver = "podman"

      config {
        image = var.MAILPIT_IMAGE
      }

      resources {
        cpu    = 200
        memory = 256
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
  # Stripe Mock
  # ===============================================================

  group "stripe-mock" {
    count = 1

    network {
      mode = "bridge"

      port "http" {
        to = 12111
      }
    }

    service {
      name         = "redaxify-stripe-mock"
      port         = "http"
      provider     = "nomad"
      address_mode = "alloc"

      check {
        type         = "tcp"
        port         = "http"
        interval     = "10s"
        timeout      = "3s"
        address_mode = "alloc"
      }
    }

    task "stripe-mock" {
      driver = "podman"

      config {
        image = var.STRIPE_MOCK_IMAGE
      }

      resources {
        cpu    = 200
        memory = 256
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
  # Traefik
  # ===============================================================

  group "traefik" {
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
          "--log.level=INFO"
        ]
      }

      template {
        data = <<EOF
http:
  routers:
    redaxify-ui:
      rule: "PathPrefix(`/`)"
      entryPoints:
        - web
      service: redaxify-ui

  services:
    redaxify-ui:
      loadBalancer:
        servers:
{{ range nomadService "redaxify-backend-ui" }}
          - url: "http://{{ .Address }}:{{ .Port }}"
{{ end }}
EOF

        destination = "local/dynamic.yml"
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