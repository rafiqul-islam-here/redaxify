# ===============================================================
# Variables
# ===============================================================

variable "BACKEND_IMAGE" {
  type = string
}

variable "BACKEND_UI_IMAGE" {
  type = string
}

variable "POSTGRES_IMAGE" {
  type = string
}

variable "CLOUDFLARE_TUNNEL_TOKEN" {
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


# ===============================================================
# Job
# ===============================================================

job "redaxify" {

  namespace   = "dev"
  datacenters = ["dc1"]
  type        = "service"


  # =============================================================
  # PostgreSQL
  # =============================================================

  group "database" {

    count = 1

    shutdown_delay = "10s"

    network {
      mode = "bridge"

      port "db" {
        to = 5432
      }
    }


    service {
      name         = "redaxify-db"
      port         = "db"
      provider     = "nomad"
      address_mode = "alloc"

      check {
        type         = "tcp"
        port         = "db"
        interval     = "10s"
        timeout      = "5s"
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


  # =============================================================
  # Backend
  # =============================================================

  group "backend" {

    count = 1

    shutdown_delay = "10s"

    network {
      mode = "bridge"

      port "http" {
        to = 4000
      }
    }


    service {
      name         = "redaxify-backend"
      port         = "http"
      provider     = "nomad"
      address_mode = "alloc"

      # TCP health check
      #
      # This verifies that the backend is actually listening
      # on port 4000 without depending on the "/" route.
      #
      check {
        type         = "tcp"
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


      # -----------------------------------------------------------
      # Database connection
      # -----------------------------------------------------------
      #
      # nomadService dynamically finds the PostgreSQL service.
      #
      # The template is rendered as environment variables.
      #
      template {
        data = <<EOF
DB_HOST={{ range nomadService "redaxify-db" }}{{ .Address }}{{ end }}
DB_PORT={{ range nomadService "redaxify-db" }}{{ .Port }}{{ end }}
DB_NAME={{ env "DB_NAME" }}
DB_USER={{ env "DB_USER" }}
DB_PASSWORD={{ env "DB_PASSWORD" }}
EOF

        destination = "local/backend.env"

        env = true
      }


      env {
        DB_NAME     = var.DB_NAME
        DB_USER     = var.DB_USER
        DB_PASSWORD = var.DB_PASSWORD

        # PostgreSQL port inside the Nomad service
        DB_PORT = var.DB_PORT
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


  # =============================================================
  # Backend UI
  # =============================================================

  group "backend-ui" {

    count = 1

    shutdown_delay = "10s"

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
        type         = "tcp"
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


  # =============================================================
  # Traefik + Cloudflare Tunnel
  # =============================================================

  group "cloudflare" {

    count = 1

    shutdown_delay = "10s"

    network {
      mode = "bridge"

      port "web" {
        to = 80
      }
    }


    # ===========================================================
    # Traefik
    # ===========================================================

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


      # ---------------------------------------------------------
      # Dynamic Traefik configuration
      # ---------------------------------------------------------

      template {
        data = <<EOF
http:

  routers:

    redaxify-backend-ui:
      rule: "PathPrefix(`/`)"
      entryPoints:
        - web
      service: redaxify-backend-ui


  services:

    redaxify-backend-ui:

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


    # ===========================================================
    # Cloudflare Tunnel
    # ===========================================================

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