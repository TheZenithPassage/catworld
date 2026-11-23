#!/usr/bin/env python3
"""Populate an empty, isolated CatWorld demo through the application API."""

import argparse
import json
import sys
from dataclasses import dataclass
from datetime import datetime, time, timedelta, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, ProxyHandler, Request, build_opener


GENERATION_HEADER = "X-CatWorld-Demo-Generation"
# The demo business clock uses Buenos Aires, which is on UTC-03 year round.
BUSINESS_TIME_ZONE = timezone(timedelta(hours=-3))

NIGHTLY_RATES = {
    "ONE_CAT": 24_000,
    "ONE_CAT_7_TO_14": 22_000,
    "ONE_CAT_15_TO_29": 20_000,
    "ONE_CAT_30_PLUS": 18_000,
    "TWO_CATS": 38_000,
    "THREE_PLUS_CATS": 49_000,
}

# All names and contact details are fictional fixture data.
HOUSEHOLDS = {
    "Emilia Vilar": (
        ("Mora", "FEMALE", 4, "Carey", "Prefiere dormir en lugares altos."),
        ("Higo", "MALE", 2, "Naranja atigrado", "Le gusta jugar con pelotas de tela."),
    ),
    "Joaquín Astiz": (
        ("Canelo", "MALE", 7, "Marrón atigrado", "Come mejor si el plato queda cerca del refugio."),
    ),
    "Paula Miraflores": (
        ("Nube", "FEMALE", 5, "Blanco", "Busca compañía durante la tarde."),
        ("Pixel", "MALE", 3, "Negro y blanco", "Curioso, revisa cada estante."),
    ),
    "Iván Jacarandá": (
        ("Oliva", "FEMALE", 6, "Gris", "Necesita un rato tranquilo al llegar."),
    ),
    "Renata Solís": (
        ("Menta", "FEMALE", 4, "Tricolor", "Le gusta la almohadilla que trae de casa."),
        ("Duna", "FEMALE", 3, "Arena", "Se relaja con la rutina habitual de comida."),
        ("Fósforo", "MALE", 5, "Negro", "Durante el día suele compartir cama con Duna."),
    ),
    "Diego del Prado": (
        ("Tilo", "MALE", 8, "Chocolate", "Duerme después del desayuno."),
    ),
    "Inés Barlovento": (
        ("Chispa", "FEMALE", 2, "Naranja y blanco", "Muy activa antes de la cena."),
    ),
    "Alma Fresnel": (
        ("Greta", "FEMALE", 9, "Gris y blanco", "Prefiere observar desde su transportadora."),
    ),
}


@dataclass(frozen=True)
class StayFixture:
    cats: tuple[str, ...]
    arrival: int
    departure: int
    notes: str
    payment: str = "unpaid"
    arrival_transfer: bool = False
    departure_transfer: bool = False
    transfer_waived: bool = False
    cancelled: bool = False


STAYS = (
    StayFixture(("Nube", "Pixel"), -25, -20, "Trajeron dos mantas de casa.", "settled"),
    StayFixture(("Mora",), -15, -10, "Primera visita de Mora.", "settled"),
    StayFixture(("Menta", "Duna", "Fósforo"), -12, -4, "Entrega conjunta.", "settled"),
    StayFixture(("Oliva",), -7, -3, "Volvió a usar su refugio habitual.", "partial"),
    StayFixture(("Canelo",), -6, 0, "Devolver el bolso de alimento.", "settled", departure_transfer=True),
    StayFixture(("Tilo",), -4, 1, "Confirmar el horario de recogida.", "corrected"),
    StayFixture(("Mora", "Higo"), -2, 3, "Comen en platos separados.", "partial", arrival_transfer=True),
    StayFixture(("Nube",), 0, 5, "La dueña trae el alimento a la llegada."),
    StayFixture(("Fósforo",), 1, 5, "La familia cambió las fechas del viaje.", cancelled=True),
    StayFixture(("Chispa",), 2, 7, "La dueña preguntó por traslado.", "pending", arrival_transfer=True),
    StayFixture(("Pixel",), 3, 7, "Avisar cuando se instale en su habitación."),
    StayFixture(
        ("Oliva",), 5, 13, "Traslado de cortesía coordinado con la dueña.",
        "partial", arrival_transfer=True, departure_transfer=True, transfer_waived=True,
    ),
    StayFixture(("Canelo",), 7, 12, "Seña recibida para la próxima visita.", "partial"),
    StayFixture(("Tilo",), 12, 20, "Precio pendiente de acuerdo.", "pending"),
    StayFixture(("Higo",), 14, 21, "Traer su pelota de tela."),
    StayFixture(("Menta",), 18, 23, "Reserva individual por un viaje familiar."),
)


class SeedError(Exception):
    pass


class NoRedirects(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class DemoApi:
    def __init__(self, url):
        target = urlsplit(url)
        if (
            target.scheme != "http"
            or target.hostname not in {"127.0.0.1", "::1", "localhost"}
            or target.port is None
            or target.username is not None
            or target.path not in {"", "/"}
            or target.query
            or target.fragment
        ):
            raise SeedError("Use the HTTP URL of the demo gateway on loopback, including its port.")
        self.url = url.rstrip("/")
        self.opener = build_opener(ProxyHandler({}), NoRedirects())
        self.headers = {"Authorization": "Demo"}

        user, headers = self.request("POST", "/auth/login")
        generation = headers.get(GENERATION_HEADER)
        if not generation or not isinstance(user, dict) or user.get("role") != "ADMIN":
            raise SeedError("The gateway must return a demo generation and an ADMIN identity.")
        self.headers[GENERATION_HEADER] = generation

    def request(self, method, path, body=None, *, content_type="application/json"):
        headers = {**self.headers, "Accept": "application/json"}
        if body is not None:
            headers["Content-Type"] = content_type
            if content_type == "application/json":
                body = json.dumps(body).encode("utf-8")
        request = Request(self.url + "/api" + path, body, headers, method=method)
        try:
            with self.opener.open(request, timeout=15) as response:
                data = response.read()
                return json.loads(data) if data else None, response.headers
        except HTTPError as error:
            detail = error.read(1000).decode("utf-8", errors="replace")
            raise SeedError(f"{method} {path} returned HTTP {error.code}: {detail}") from error
        except (URLError, TimeoutError) as error:
            raise SeedError(f"{method} {path} could not reach the demo gateway: {error}") from error
        except (UnicodeDecodeError, json.JSONDecodeError) as error:
            raise SeedError(f"{method} {path} did not return a valid JSON response.") from error

    def json(self, method, path, body=None):
        return self.request(method, path, body)[0]

    def create_cat(self, fields):
        boundary = "catworld-demo-seed"
        body = (
            f"--{boundary}\r\n"
            'Content-Disposition: form-data; name="cat"\r\n'
            "Content-Type: application/json\r\n\r\n"
            f"{json.dumps(fields)}\r\n"
            f"--{boundary}--\r\n"
        ).encode("utf-8")
        return self.request(
            "POST", "/cats", body, content_type=f"multipart/form-data; boundary={boundary}"
        )[0]


def require_empty_workspace(api):
    for resource in ("/owners", "/vets", "/cats", "/stays"):
        if api.json("GET", resource):
            raise SeedError(f"The demo database already contains {resource[1:]}. Reset it before seeding.")
    if any(rate["nightlyRate"] is not None for rate in api.json("GET", "/nightly-reference-rates")):
        raise SeedError("The demo already has nightly rates. Reset it before seeding.")
    if api.json("GET", "/transfer-rate")["transferRate"] is not None:
        raise SeedError("The demo already has a transfer rate. Reset it before seeding.")


def seed_households(api, today):
    vet_ids = []
    for index, name in enumerate(("Veterinaria Huella Lunar", "Consultorio Bigotes del Sur"), start=1):
        vet = api.json("POST", "/vets", {
            "name": name,
            "phoneNumber": f"+54 11 0000-020{index}",
            "registrationNumber": f"DEMO-{index:03d}",
        })
        vet_ids.append(vet["id"])
    cat_ids = {}
    for index, (owner_name, cats) in enumerate(HOUSEHOLDS.items(), start=1):
        owner = api.json("POST", "/owners", {
            "fullName": owner_name,
            "primaryPhone": f"+54 11 0000-01{index:02d}",
        })
        for name, sex, age, color, notes in cats:
            cat = api.create_cat({
                "name": name,
                "sex": sex,
                "birthDate": (today - timedelta(days=age * 365)).isoformat(),
                "color": color,
                "notes": notes,
                "lastRabiesDate": (today - timedelta(days=235 + index)).isoformat(),
                "lastTripleFelineDate": (today - timedelta(days=220 + index)).isoformat(),
                "ownerId": owner["id"],
                "vetId": vet_ids[(index - 1) % len(vet_ids)],
            })
            cat_ids[name] = cat["id"]
    return cat_ids


def seed_stay(api, today, cat_ids, fixture):
    arrival_date = today + timedelta(days=fixture.arrival)
    departure_date = today + timedelta(days=fixture.departure)
    booking = {
        "catIds": [cat_ids[name] for name in fixture.cats],
        "startAt": datetime.combine(arrival_date, time(10, 30)).isoformat(),
        "endAt": datetime.combine(departure_date, time(16, 0)).isoformat(),
        "arrivalTransferRequired": fixture.arrival_transfer,
        "departureTransferRequired": fixture.departure_transfer,
        "transferWaived": fixture.transfer_waived,
    }
    preview = api.json("POST", "/stays/pricing-preview", booking)
    agreement = {"pricePending": True} if fixture.payment == "pending" else {
        "agreedAmount": preview["suggestedAmount"],
    }
    stay = api.json("POST", "/stays", {
        **booking,
        "notes": fixture.notes,
        "overrideVaccineConflicts": False,
        "confirmation": preview["confirmation"],
        "pricingDecision": agreement,
    })
    stay_path = f"/stays/{stay['stayId']}"
    if fixture.cancelled:
        api.json("PATCH", f"{stay_path}/cancel")

    if fixture.payment in {"unpaid", "pending"}:
        return
    agreed = int(stay["agreedAmount"])
    full_payment = fixture.payment == "settled"
    amount = agreed if full_payment else agreed // 3
    payment_date = min(today, departure_date if full_payment else arrival_date - timedelta(days=1))
    if fixture.payment == "corrected":
        payment_date = today
    updated = api.json("POST", f"{stay_path}/payments", {
        "amount": amount,
        "paymentDate": payment_date.isoformat(),
        "note": "Pago completo" if full_payment else "Seña de la reserva",
    })
    if fixture.payment == "corrected":
        payment_id = updated["payments"][0]["paymentId"]
        api.json("PATCH", f"{stay_path}/payments/{payment_id}", {
            "amount": amount - 1_500,
            "reason": "Corrección del importe según el comprobante de la seña.",
        })


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", required=True, help="HTTP origin of the loopback demo gateway")
    args = parser.parse_args()
    try:
        api = DemoApi(args.url)
        require_empty_workspace(api)
        today = datetime.now(BUSINESS_TIME_ZONE).date()

        cat_ids = seed_households(api, today)
        for key, amount in NIGHTLY_RATES.items():
            api.json("PUT", f"/nightly-reference-rates/{key}", {"nightlyRate": amount})
        api.json("PUT", "/transfer-rate", {"transferRate": 12_000})
        for stay in STAYS:
            seed_stay(api, today, cat_ids, stay)
    except (SeedError, ValueError) as error:
        print(f"Demo seed failed: {error}", file=sys.stderr)
        return 1
    print(f"Seeded demo for {today}: {len(HOUSEHOLDS)} owners, {len(cat_ids)} cats, {len(STAYS)} stays.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
