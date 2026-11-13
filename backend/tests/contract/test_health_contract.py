from app.api.v1 import health


async def test_health_reports_ok_and_build_info(client, monkeypatch):
    monkeypatch.setenv("APP_VERSION", "0.1.0")
    monkeypatch.setenv("GIT_SHA", "397655e")
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    body = response.json()
    assert set(body) == {"status", "build"}
    assert body["status"] == "ok"
    assert set(body["build"]) == {"version", "buildNumber", "buildDate", "releaseTag", "commit"}
    assert body["build"]["version"] == "0.1.0"
    assert body["build"]["commit"] == "397655e"


async def test_health_reports_unavailable_without_details(client, monkeypatch):
    async def _failing_ping() -> None:
        raise RuntimeError("connection refused to mongodb://secret@host")

    monkeypatch.setattr(health, "ping_database", _failing_ping)
    response = await client.get("/health")
    assert response.status_code == 503
    assert response.headers["cache-control"] == "no-store"
    assert response.json()["status"] == "unavailable"
    assert "secret" not in response.text
    assert "refused" not in response.text
