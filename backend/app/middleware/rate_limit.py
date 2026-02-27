import time

from fastapi import HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.clients: dict = {}

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        now = time.time()
        if client_ip in self.clients:
            count, window_start = self.clients[client_ip]
            if now - window_start > self.window_seconds:
                self.clients[client_ip] = (1, now)
            elif count >= self.max_requests:
                raise HTTPException(status_code=429, detail="Too many requests")
            else:
                self.clients[client_ip] = (count + 1, window_start)
        else:
            self.clients[client_ip] = (1, now)
        return await call_next(request)
