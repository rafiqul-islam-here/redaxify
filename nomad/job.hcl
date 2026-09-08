# ===============================================================
# Image Variables
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

    network {
      mode = "bridge"

      port "postgres" {
        to = 5432
      }
    }

    service {
      name         = "redaxify-db"
      port         = "postgres"
      provider     = "nomad"
      address_mode = "alloc"

      check {
        type         = "tcp"
        port         = "postgres"
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
        POSTGRES_USER     = "postgres"
        POSTGRES_PASSWORD = "postgres"
        POSTGRES_DB       = "redaxify_dev"
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

      # -----------------------------------------------------------
      # PostgreSQL connection
      #
      # Nomad service discovery dynamically supplies the DB
      # allocation address and port.
      # -----------------------------------------------------------

      template {
        data = <<EOF
{{- range nomadService "redaxify-db" }}
DATABASE_URL=postgresql://postgres:postgres@{{ .Address }}:{{ .Port }}/redaxify_dev
DIRECT_URL=postgresql://postgres:postgres@{{ .Address }}:{{ .Port }}/redaxify_dev
{{- end }}
EOF

        destination = "secrets/database.env"
        env         = true
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
}