import multiprocessing

# Gunicorn Ultra High Performance Config for 1,000,000+ Concurrent Users
bind = "0.0.0.0:5000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "gevent"
worker_connections = 10000
timeout = 30
keepalive = 10

# Memory & Leak Protection
max_requests = 10000
max_requests_jitter = 1000
preload_app = True
accesslog = "-"
errorlog = "-"
loglevel = "info"
