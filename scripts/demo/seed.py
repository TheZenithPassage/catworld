#!/usr/bin/env python3
"""Write the fictional CatWorld fixtures as a MySQL transaction for a fresh demo database."""

import argparse
import hashlib
import json
import random
import sys
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from pathlib import Path
from uuid import UUID, uuid5

import fixture_text as text


OWNER_COUNT = 500
CAT_COUNT = 800
VET_COUNT = 20
PAYMENT_COUNT = 3_000
PORTRAIT_COUNT = 160
GALLERY_COUNT = 80
INTAKE_COUNT = 96
PENDING_INTAKE_COUNT = 32
STAY_COUNTS = {"completed": 2_220, "checked-in": 24, "upcoming": 120, "cancelled": 36}

NIGHTLY_RATES = {
    "ONE_CAT": 24_000,
    "ONE_CAT_7_TO_14": 22_000,
    "ONE_CAT_15_TO_29": 20_000,
    "ONE_CAT_30_PLUS": 18_000,
    "TWO_CATS": 38_000,
    "THREE_PLUS_CATS": 49_000,
}
TRANSFER_RATE = 12_000
LITTER_RATE = 3_600

# The Flyway standard breeds already exist in an empty demo schema.
STANDARD_BREEDS = {
    "Común": UUID("750a75af-c2e2-4440-b809-ef5482b668ed"),
    "Siamés": UUID("d58827db-0efe-488f-84b3-93e7ad1d9a8a"),
    "Persa": UUID("d63de50e-a9cf-464b-93a1-5ac31395b4a6"),
}
NAMESPACE = UUID("84eb3e02-dbb9-5699-ae7e-3e68ee3d481e")

PHOTO_LOOKS = (
    ("Naranja atigrado", "Pelo corto"), ("Gris atigrado", "Pelo corto"),
    ("Negro y blanco", "Pelo corto"), ("Tricolor", "Pelo corto"),
    ("Gris", "Pelo corto"), ("Crema", "Pelo largo"),
    ("Negro", "Pelo corto"), ("Blanco y marrón", "Pelo corto"),
)


class SeedError(Exception):
    pass


@dataclass(frozen=True)
class SqlVariable:
    name: str


ACTOR = SqlVariable("demo_actor")


def fixture_id(kind, index):
    return uuid5(NAMESPACE, f"{kind}:{index}")


def utc(local_timestamp):
    # Demo business dates are in America/Argentina/Buenos_Aires (UTC-03).
    # Stay boundaries use local DATETIME, whereas audit and movement timestamps are UTC.
    return local_timestamp + timedelta(hours=3)


def at(day, hour, minute=0):
    return datetime.combine(day, time(hour, minute))


def json_text(data):
    return json.dumps(data, ensure_ascii=False, separators=(",", ":"))


def sql_value(value):
    if value is None:
        return "NULL"
    if isinstance(value, SqlVariable):
        return f"@{value.name}"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, UUID):
        return f"X'{value.hex}'"
    if isinstance(value, bytes):
        return f"X'{value.hex()}'"
    if isinstance(value, datetime):
        value = value.isoformat(sep=" ")
    elif isinstance(value, date):
        value = value.isoformat()
    if isinstance(value, str):
        return "'" + value.replace("'", "''") + "'"
    if isinstance(value, int):
        return str(value)
    raise TypeError(f"Unsupported SQL fixture value: {type(value).__name__}")


class FixtureRows:
    TABLE_ORDER = (
        "cat_profile_options", "food_brands", "food_varieties", "vets", "owners", "cats", "cat_photos",
        "cat_informational_photos", "stays", "stay_cat", "stay_actual_movements", "sensitive_stay_contexts",
        "sensitive_stay_context_cats", "stay_pricing_decisions", "stay_payments", "stay_payment_annulments",
        "stay_payment_edits", "cat_intake_invitations", "cat_intake_reviews", "cat_intake_photos",
    )

    def __init__(self):
        self.tables = {}

    def add(self, table, **values):
        columns = tuple(values)
        table_columns, rows = self.tables.setdefault(table, (columns, []))
        if columns != table_columns:
            raise SeedError(f"Inconsistent fixture columns for {table}.")
        rows.append(tuple(values.values()))

    def write(self, output):
        # Audit snapshots are generated with several different types of fixtures.
        # Insert each table in foreign-key order.
        for name in self.TABLE_ORDER:
            columns, rows = self.tables.get(name, ((), ()))
            heading = f"INSERT INTO {name} ({', '.join(columns)}) VALUES\n"
            for start in range(0, len(rows), 200):
                output.write(heading)
                batch = rows[start:start + 200]
                output.write(",\n".join(
                    "(" + ", ".join(map(sql_value, row)) + ")" for row in batch
                ))
                output.write(";\n")


@dataclass(frozen=True)
class CatalogEntry:
    id: UUID
    name: str


@dataclass(frozen=True)
class Photo:
    variable: SqlVariable
    content: bytes
    width: int
    height: int

    @property
    def sha256(self):
        return hashlib.sha256(self.content).hexdigest()


def load_photo(path, variable):
    data = path.read_bytes()
    if not data.startswith(b"\xff\xd8"):
        raise SeedError(f"{path.name} is not a JPEG.")
    offset = 2
    while offset + 9 <= len(data) and data[offset] == 0xff:
        marker = data[offset + 1]
        if marker == 0xff:
            offset += 1
            continue
        size = int.from_bytes(data[offset + 2:offset + 4], "big")
        if size < 2 or offset + 2 + size > len(data):
            break
        if marker in {0xc0, 0xc1, 0xc2} and size >= 7:
            height = int.from_bytes(data[offset + 5:offset + 7], "big")
            width = int.from_bytes(data[offset + 7:offset + 9], "big")
            if 0 < width <= 1600 and 0 < height <= 1600:
                return Photo(SqlVariable(variable), data, width, height)
            break
        offset += 2 + size
    raise SeedError(f"{path.name} must be a JPEG no larger than 1600 × 1600.")


def load_photos():
    directory = Path(__file__).resolve().parent / "photos"
    pairs = []
    for index in range(1, len(PHOTO_LOOKS) + 1):
        portraits = list(directory.glob(f"{index:02d}-*-a-portrait.jpg"))
        gallery = list(directory.glob(f"{index:02d}-*-b-gallery.jpg"))
        if len(portraits) != 1 or len(gallery) != 1:
            raise SeedError(f"Expected one portrait and one gallery asset for pair {index:02d}.")
        pairs.append((
            load_photo(portraits[0], f"demo_portrait_{index}"),
            load_photo(gallery[0], f"demo_gallery_{index}"),
        ))
    return pairs


def catalog(rows):
    option_groups = {
        "breed": text.ADDITIONAL_BREEDS, "coat": text.COATS, "color": text.COLORS + ("Blanco y marrón",),
        "litterDetail": text.LITTER_TYPES, "lastInternalDewormerName": text.DEWORMERS,
        "lastExternalDewormerName": text.FLEA_TREATMENTS,
    }
    options = {}
    for category, names in option_groups.items():
        options[category] = {}
        for name in names:
            entry = CatalogEntry(fixture_id(category, name), name)
            rows.add("cat_profile_options", id=entry.id, category=category, name=name,
                     normalized_key=name.lower().encode("utf-8"))
            options[category][name] = entry
    options["breed"].update((name, CatalogEntry(key, name)) for name, key in STANDARD_BREEDS.items())

    brands = [CatalogEntry(fixture_id("food-brand", name), name) for name in text.FOOD_BRANDS]
    for brand in brands:
        rows.add("food_brands", id=brand.id, name=brand.name, normalized_key=brand.name.lower().encode("utf-8"))
    varieties = {}
    for index, brand in enumerate(brands):
        varieties[brand.id] = []
        for name in text.FOOD_VARIETIES[index % len(text.FOOD_VARIETIES)]:
            variety = CatalogEntry(fixture_id("food-variety", f"{brand.name}:{name}"), name)
            rows.add("food_varieties", id=variety.id, brand_id=brand.id, name=name,
                     normalized_key=name.lower().encode("utf-8"))
            varieties[brand.id].append(variety)
    return options, brands, varieties


@dataclass(frozen=True)
class Owner:
    index: int
    id: UUID
    name: str
    cats: list


@dataclass(frozen=True)
class Cat:
    id: UUID
    name: str
    care: str
    litter: str
    triple_feline: date
    rabies: date
    photo_index: int | None


def add_households(rows, today, rng, options, brands, varieties, photos):
    setup_day = today - timedelta(days=780)
    vet_ids = []
    for index, name in enumerate(text.VET_NAMES):
        vet_id = fixture_id("vet", index)
        vet_ids.append(vet_id)
        created_at = utc(at(setup_day + timedelta(days=index), 10))
        prefix = "Consultorio" if index % 3 == 0 else "Veterinaria"
        rows.add("vets", id=vet_id, name=f"{prefix} {name}",
                 phone_number=f"+54 11 0000-{2000 + index}", registration_number=f"DEMO-{index + 1:03}",
                 notes="Atiende con turno." if index % 4 == 0 else None,
                 created_at=created_at, updated_at=created_at, created_by_id=ACTOR)

    names = rng.sample([f"{first} {last}" for first in text.GIVEN_NAMES for last in text.SURNAMES], OWNER_COUNT)
    # 250 single-cat, 200 two-cat and 50 three-cat households.
    cat_counts = [1] * 250 + [2] * 200 + [3] * 50
    rng.shuffle(cat_counts)
    owners = []
    for index, name in enumerate(names):
        owner = Owner(index, fixture_id("owner", index), name, [])
        owners.append(owner)
        created_at = utc(at(setup_day + timedelta(days=index % 132), 10, index % 60))
        rows.add("owners", id=owner.id, full_name=name, primary_phone=f"+54 11 0000-{1000 + index}",
                 secondary_phone=f"+54 11 0000-{5000 + index}" if index % 8 == 0 else None,
                 secondary_phone_name="Contacto alternativo del hogar" if index % 8 == 0 else None,
                 notes="Prefiere coordinar la entrega por la tarde." if index % 7 == 0 else None,
                 created_at=created_at, updated_at=created_at, created_by_id=ACTOR)

    cat_index = 0
    for owner, cat_count in zip(owners, cat_counts):
        for _ in range(cat_count):
            photo_index = cat_index % len(photos) if cat_index < PORTRAIT_COUNT else None
            sex = "FEMALE" if cat_index % 3 == 0 or photo_index == 3 else "MALE"
            name = rng.choice(text.CAT_NAMES[sex])
            while any(cat.name == name for cat in owner.cats):
                name = rng.choice(text.CAT_NAMES[sex])
            breed_name = "Común" if photo_index is not None or rng.random() < 0.72 else rng.choice(tuple(options["breed"]))
            if photo_index is None:
                color_name = rng.choice(text.COLORS)
                coat_name = rng.choice(text.COATS)
            else:
                color_name, coat_name = PHOTO_LOOKS[photo_index]
            breed = options["breed"][breed_name]
            coat = options["coat"][coat_name]
            color = options["color"][color_name]
            brand = rng.choice(brands)
            variety = rng.choice(varieties[brand.id])
            litter = rng.choice(("OWN", "OWN", "OWN", "SHARED", "SHARED"))
            litter_type = rng.choice(list(options["litterDetail"].values())) if litter == "OWN" else None
            internal = rng.choice(list(options["lastInternalDewormerName"].values()))
            external = rng.choice(list(options["lastExternalDewormerName"].values()))
            birthday = today - timedelta(days=rng.randint(3 * 365, 14 * 365))
            exact_birth = cat_index % 5 != 0
            triple = today - timedelta(days=rng.randint(12, 240))
            rabies = today - timedelta(days=rng.randint(12, 242))
            care = rng.choice(text.CARE_NOTES)
            cat = Cat(fixture_id("cat", cat_index), name, care, litter, triple, rabies, photo_index)
            owner.cats.append(cat)
            created_at = utc(at(setup_day + timedelta(days=owner.index % 132), 11))
            updated_at = utc(at(max(triple, rabies), 15))
            rows.add("cats", id=cat.id, name=name, birth_date=birthday if exact_birth else None,
                     birth_year=None if exact_birth else birthday.year, sex=sex, breed=breed.name, breed_option_id=breed.id,
                     coat=coat.name, coat_option_id=coat.id, color=color.name, color_option_id=color.id,
                     food_brand=brand.name, food_brand_id=brand.id, food_detail=variety.name, food_variety_id=variety.id,
                     litter_brand=litter_type.name if litter_type else "Usa las de CatWorld", litter_preference=litter,
                     litter_detail=litter_type.name if litter_type else None,
                     litter_detail_option_id=litter_type.id if litter_type else None,
                     personality=rng.choice(text.PERSONALITIES), care_instructions=care,
                     last_internal_dewormer_name=internal.name, last_internal_dewormer_option_id=internal.id,
                     last_internal_deworming_date=today - timedelta(days=rng.randint(20, 120)),
                     last_external_dewormer_name=external.name, last_external_dewormer_option_id=external.id,
                     last_external_deworming_date=today - timedelta(days=rng.randint(7, 60)),
                     last_triple_feline_date=triple, last_rabies_date=rabies, owner_id=owner.id,
                     vet_id=vet_ids[cat_index % len(vet_ids)] if cat_index % 10 != 0 else None,
                     created_at=created_at, updated_at=updated_at, created_by_id=ACTOR)
            if photo_index is not None:
                portrait, gallery = photos[photo_index]
                rows.add("cat_photos", cat_id=cat.id, content=portrait.variable, width=portrait.width,
                         height=portrait.height, byte_size=len(portrait.content), sha256=portrait.sha256)
                if cat_index < GALLERY_COUNT:
                    rows.add("cat_informational_photos", id=fixture_id("gallery", cat_index), cat_id=cat.id,
                             created_at=updated_at, content=gallery.variable)
            cat_index += 1
    return owners



@dataclass(frozen=True)
class Stay:
    index: int
    id: UUID
    kind: str
    owner: Owner
    cats: tuple
    start: datetime
    end: datetime
    booked_on: date
    cancelled_at: datetime | None
    agreed_amount: int | None


def stay_schedule(today, owners, rng):
    for cycle in range(5):
        group = owners if cycle < 4 else rng.sample(owners, STAY_COUNTS["completed"] - 4 * OWNER_COUNT)
        band_start = today - timedelta(days=605 - cycle * 132)
        for owner in group:
            start = band_start + timedelta(days=rng.randrange(60))
            nights = rng.choice((2, 3, 4, 4, 5, 6, 7, 8, 10, 14, 21, 33))
            end = min(start + timedelta(days=nights), today - timedelta(days=12))
            yield "completed", owner, start, end

    for index, owner in enumerate(owners[:STAY_COUNTS["checked-in"]]):
        due_offsets = (-2, -1, *([0] * 6), *([1] * 5), *range(2, 13))
        end_offset = due_offsets[index]
        start_offset = min(-1, end_offset - rng.randint(2, 9))
        yield "checked-in", owner, today + timedelta(days=start_offset), today + timedelta(days=end_offset)

    first_upcoming = STAY_COUNTS["checked-in"]
    last_upcoming = first_upcoming + STAY_COUNTS["upcoming"]
    for index, owner in enumerate(owners[first_upcoming:last_upcoming]):
        if index < 5:
            start_offset = 0
        elif index < 12:
            start_offset = 1
        elif index < 32:
            start_offset = rng.randint(2, 7)
        else:
            start_offset = rng.randint(8, 96)
        start = today + timedelta(days=start_offset)
        yield "upcoming", owner, start, start + timedelta(days=rng.randint(2, 15))

    last_cancelled = last_upcoming + STAY_COUNTS["cancelled"]
    for owner in owners[last_upcoming:last_cancelled]:
        start = today + timedelta(days=rng.randint(5, 96))
        yield "cancelled", owner, start, start + timedelta(days=rng.randint(2, 12))


def nightly_rate(cat_count, nights):
    if cat_count >= 3:
        return NIGHTLY_RATES["THREE_PLUS_CATS"]
    if cat_count == 2:
        return NIGHTLY_RATES["TWO_CATS"]
    if nights >= 30:
        return NIGHTLY_RATES["ONE_CAT_30_PLUS"]
    if nights >= 15:
        return NIGHTLY_RATES["ONE_CAT_15_TO_29"]
    if nights >= 7:
        return NIGHTLY_RATES["ONE_CAT_7_TO_14"]
    return NIGHTLY_RATES["ONE_CAT"]


def add_sensitive_context(rows, stay, key, cancelled_at=None):
    context = fixture_id("sensitive-context", key)
    rows.add("sensitive_stay_contexts", id=context, stay_id=stay.id, owner_id=stay.owner.id,
             owner_full_name=stay.owner.name, stay_start_at=stay.start, stay_end_at=stay.end,
             stay_cancelled_at=cancelled_at)
    for cat in stay.cats:
        rows.add("sensitive_stay_context_cats", context_id=context, cat_id=cat.id, cat_name=cat.name)
    return context


def add_stays(rows, today, rng, owners):
    stays = []
    notes = {
        "completed": text.HISTORY_NOTES, "checked-in": text.DEPARTURE_NOTES,
        "upcoming": text.ARRIVAL_NOTES, "cancelled": text.CANCELLATION_NOTES,
    }
    statuses = {"completed": "CHECKED_OUT", "checked-in": "CHECKED_IN",
                "upcoming": "RESERVED", "cancelled": "RESERVED"}
    for index, (kind, owner, start_day, end_day) in enumerate(stay_schedule(today, owners, rng)):
        stay_id = fixture_id("stay", index)
        cat_count = len(owner.cats) if rng.random() < 0.78 else rng.randint(1, len(owner.cats))
        cats = tuple(owner.cats[:cat_count])
        start = at(start_day, rng.randint(9, 16), rng.choice((0, 15, 30, 45)))
        end = at(end_day, rng.randint(9, 19), rng.choice((0, 15, 30, 45)))
        booked_on = min(start_day - timedelta(days=rng.randint(7, 33)), today - timedelta(days=1))
        arrived_at = start + timedelta(minutes=rng.randint(-20, 50)) if kind in {"completed", "checked-in"} else None
        departed_at = end + timedelta(minutes=rng.randint(-30, 45)) if kind == "completed" else None
        cancelled_at = None
        if kind == "cancelled":
            cancelled_at = at(min(start_day - timedelta(days=2), today - timedelta(days=rng.randint(1, 8))), 11)
            booked_on = min(booked_on, cancelled_at.date() - timedelta(days=5))
        booked_at = utc(at(booked_on, 11))
        changed_at = utc((cancelled_at or departed_at or arrived_at) + timedelta(minutes=4)) if (
            cancelled_at or departed_at or arrived_at
        ) else booked_at

        nights = (end_day - start_day).days
        night_rate = nightly_rate(cat_count, nights)
        arrival_transfer = index % 7 == 0
        departure_transfer = index % 11 == 0
        transfer_waived = index % 5 == 0 and (arrival_transfer or departure_transfer)
        transfer_rate = TRANSFER_RATE if arrival_transfer or departure_transfer else None
        transfer_total = 0 if transfer_waived else TRANSFER_RATE * (arrival_transfer + departure_transfer)
        litter_choices = tuple("ONE" if (index + offset) % 17 == 0 else
                               ("HALF" if cat.litter == "SHARED" else "OWN")
                               for offset, cat in enumerate(cats))
        litter_half_kilos = sum({"OWN": 0, "HALF": 1, "ONE": 2}[choice] for choice in litter_choices)
        litter_rate = LITTER_RATE if litter_half_kilos else None
        suggestion = night_rate * nights + transfer_total + nights * litter_half_kilos * LITTER_RATE // 2
        price_pending = index % 29 == 0
        discount = 5_000 if index % 21 == 0 and not price_pending else 0
        agreed_amount = None if price_pending else suggestion - discount

        stay = Stay(index, stay_id, kind, owner, cats, start, end, booked_on, cancelled_at, agreed_amount)
        stays.append(stay)
        rows.add("stays", id=stay.id, start_at=start, end_at=end, cancelled_at=cancelled_at,
                 notes=rng.choice(notes[kind]), owner_id=owner.id, created_at=booked_at,
                 updated_at=changed_at, created_by_id=ACTOR, retained_nightly_rate=night_rate,
                 arrival_transfer_required=arrival_transfer, departure_transfer_required=departure_transfer,
                 retained_transfer_rate=transfer_rate, transfer_waived=transfer_waived,
                 retained_litter_rate_per_kg=litter_rate, price_pending=price_pending, agreed_amount=agreed_amount,
                 movement_status=statuses[kind], movement_revision=int(arrived_at is not None) + int(departed_at is not None))

        for cat, litter in zip(cats, litter_choices):
            rows.add("stay_cat", stay_id=stay.id, cat_id=cat.id, litter_choice=litter)
        for movement_type, movement_time in (("ARRIVAL", arrived_at), ("DEPARTURE", departed_at)):
            if movement_time is not None:
                rows.add("stay_actual_movements", stay_id=stay.id, movement_type=movement_type,
                         occurred_at_utc=utc(movement_time), registered_at_utc=utc(movement_time + timedelta(minutes=4)),
                         recorded_by_id=ACTOR, recorded_by="demo", version=0)

        if agreed_amount is not None:
            context = add_sensitive_context(rows, stay, f"pricing:{index}") if discount else None
            choices = ",".join(f"{cat.id}={choice}" for cat, choice in zip(cats, litter_choices))
            rows.add("stay_pricing_decisions", id=fixture_id("pricing", index), stay_id=stay.id,
                     retained_nightly_rate=night_rate, new_number_of_nights=nights, new_agreed_amount=agreed_amount,
                     decided_by_id=ACTOR, decided_at=booked_at,
                     reason="Descuento acordado con la familia por estadías frecuentes." if discount else None,
                     arrival_transfer_required=arrival_transfer, departure_transfer_required=departure_transfer,
                     retained_transfer_rate=transfer_rate, transfer_waived=transfer_waived, litter_rate_per_kg=litter_rate,
                     litter_daily_half_kilos=litter_half_kilos, litter_choices=choices, sensitive_context_id=context)
    return stays


def add_payments(rows, today, rng, stays):
    payable = [stay for stay in stays if stay.agreed_amount is not None]
    settled = [stay for stay in payable if stay.kind == "completed" and stay.index % 10 < 8]
    partial = [stay for stay in payable if (stay.kind == "completed" and stay.index % 10 == 8)
               or (stay.kind in {"checked-in", "upcoming"} and stay.index % 4 != 0)]
    # Record reversals on some cancelled reservations and duplicate entries in settled bookings.
    cancelled = [stay for stay in payable if stay.kind == "cancelled" and stay.index % 2 == 0]
    duplicates = rng.sample(settled, 48 - len(cancelled))
    split_count = PAYMENT_COUNT - (len(settled) + len(partial) + len(cancelled) + len(duplicates))
    split_ids = {stay.id for stay in rng.sample(settled, split_count)}
    payment_index = 0

    def payment(stay, amount, day, note, *, voided=False, corrected=False):
        nonlocal payment_index
        payment_id = fixture_id("payment", payment_index)
        payment_index += 1
        recorded_at = utc(at(day, 12))
        edited_at = recorded_at + timedelta(hours=2) if corrected else None
        closed_at = stay.cancelled_at if stay.kind == "cancelled" else None
        voided_at = (utc(closed_at) + timedelta(minutes=10) if closed_at else
                     recorded_at + timedelta(hours=3)) if voided else None
        updated_at = edited_at or voided_at or recorded_at
        rows.add("stay_payments", id=payment_id, stay_id=stay.id, amount=amount, payment_date=day,
                 note=note, annulled=voided, registered_by_id=ACTOR, created_at=recorded_at, updated_at=updated_at)
        if voided:
            context = add_sensitive_context(rows, stay, f"annulled:{payment_index}", closed_at)
            rows.add("stay_payment_annulments", id=fixture_id("annulment", payment_index),
                     stay_id=stay.id, payment_id=payment_id, annulled_by_id=ACTOR, annulled_at=voided_at,
                     reason="Se devolvió la seña al cancelar la reserva." if closed_at else
                     "Registro duplicado al revisar el comprobante.",
                     sensitive_context_id=context, amount=amount, payment_date=day, payment_note=note,
                     registered_by_id=ACTOR, registered_at=recorded_at)
        if corrected:
            context = add_sensitive_context(rows, stay, f"payment-edit:{payment_index}")
            rows.add("stay_payment_edits", id=fixture_id("payment-edit", payment_index), stay_id=stay.id,
                     payment_id=payment_id, previous_amount=amount - 1_500, new_amount=amount, edited_by_id=ACTOR,
                     edited_at=edited_at, reason="Se ajustó el importe al total del comprobante.",
                     sensitive_context_id=context, payment_date=day, payment_note=note,
                     registered_by_id=ACTOR, registered_at=recorded_at)

    for stay in settled:
        amount = stay.agreed_amount
        if stay.id in split_ids:
            deposit = amount // 3
            payment(stay, deposit, stay.start.date() - timedelta(days=2), "Seña de la reserva.",
                    corrected=stay.index % 31 == 0)
            amount -= deposit
        payment(stay, amount, stay.end.date(), "Saldo al retirar." if stay.id in split_ids else "Pago completo.")
    for stay in partial:
        payment(stay, stay.agreed_amount // 3, min(today - timedelta(days=1), stay.start.date() - timedelta(days=2)),
                "Seña de la reserva.", corrected=stay.index % 19 == 0)
    for stay in cancelled:
        payment(stay, stay.agreed_amount // 3, stay.cancelled_at.date() - timedelta(days=2),
                "Seña de la reserva luego cancelada.", voided=True)
    for stay in duplicates:
        payment(stay, stay.agreed_amount // 3, stay.start.date() - timedelta(days=3),
                "Anticipo registrado dos veces.", voided=True)
    if payment_index != PAYMENT_COUNT:
        raise SeedError(f"Expected {PAYMENT_COUNT} payments, generated {payment_index}.")



def add_intakes(rows, today, owners, options, brands, varieties, photos):
    for index, owner in enumerate(owners[STAY_COUNTS["checked-in"]:][:INTAKE_COUNT]):
        invitation_id = fixture_id("intake-invitation", index)
        review_id = fixture_id("intake-review", index)
        pending = index < PENDING_INTAKE_COUNT
        new_cat = pending and index % 7 == 4
        cat = owner.cats[0]
        submitted_at = utc(at(today - timedelta(days=1 + index // 6), 10, index % 60))
        expired_at = submitted_at + timedelta(days=4)
        original = {}
        proposed = {}
        selected = {}
        requested = []
        approved_at = None
        dismissed_at = None
        base_photo = photos[index % len(photos)][0]
        cat_name = cat.name
        if new_cat:
            cat_name = ("Miel", "Violeta", "Piru", "Bimba")[index // 7]
            color, coat = PHOTO_LOOKS[index % len(photos)]
            brand = brands[index % len(brands)]
            variety = varieties[brand.id][0]
            proposed = {
                "name": cat_name, "birthYear": str(today.year - 2), "sex": "FEMALE",
                "breed": "Común", "coat": coat, "color": color, "personality": text.PERSONALITIES[index % 12],
                "foodBrand": brand.name, "foodDetail": variety.name, "litterBrand": "Usa las de CatWorld",
                "lastRabiesDate": (today - timedelta(days=18)).isoformat(),
                "lastTripleFelineDate": (today - timedelta(days=18)).isoformat(),
            }
            selected = {"breed": str(options["breed"]["Común"].id), "coat": str(options["coat"][coat].id),
                        "color": str(options["color"][color].id), "foodBrand": str(brand.id),
                        "foodDetail": str(variety.id)}
        elif pending:
            original = {"careInstructions": cat.care}
            proposed = {"careInstructions": "Dejar la bandeja lejos de la puerta y usar la manta que trae de casa."}
            requested = ["careInstructions"]
            if index % 3 == 0:
                original["lastRabiesDate"] = cat.rabies.isoformat()
                proposed["lastRabiesDate"] = (today - timedelta(days=9 + index % 8)).isoformat()
                requested.append("lastRabiesDate")
            if index % 4 == 0:
                original["lastTripleFelineDate"] = cat.triple_feline.isoformat()
                proposed["lastTripleFelineDate"] = (today - timedelta(days=14 + index % 7)).isoformat()
                requested.append("lastTripleFelineDate")
        elif index % 4 == 0:
            dismissed_at = submitted_at + timedelta(hours=4)
        else:
            approved_at = submitted_at + timedelta(hours=5)

        scope = {} if new_cat else {str(cat.id): {}}
        unsupplied_token_hash = hashlib.sha256(invitation_id.bytes).hexdigest()
        rows.add("cat_intake_invitations", id=invitation_id, owner_id=owner.id, token_hash=unsupplied_token_hash,
                 allow_new_cats=new_cat, scope_snapshot=json_text(scope),
                 requested_fields_snapshot=json_text({str(cat.id): requested} if not new_cat else {}),
                 expires_at=expired_at, submitted_at=submitted_at)
        rows.add("cat_intake_reviews", id=review_id, invitation_id=invitation_id,
                 cat_id=None if new_cat else cat.id, draft_id=fixture_id("intake-draft", index) if new_cat else None,
                 cat_name=cat_name, original_fields=json_text(original), proposed_fields=json_text(proposed),
                 proposed_option_ids=json_text(selected) if selected else None, submitted_at=submitted_at,
                 approved_at=approved_at, dismissed_at=dismissed_at)
        if new_cat:
            rows.add("cat_intake_photos", id=fixture_id("intake-photo", index), review_id=review_id,
                     content=base_photo.variable, portrait_width=base_photo.width, portrait_height=base_photo.height,
                     portrait_sha256=base_photo.sha256, frame_x=50, frame_y=50, frame_zoom=100)
        elif pending and index % 5 == 0 and cat.photo_index is not None:
            _, gallery = photos[cat.photo_index]
            rows.add("cat_intake_photos", id=fixture_id("intake-photo", index), review_id=review_id,
                     content=gallery.variable, portrait_width=None, portrait_height=None, portrait_sha256=None,
                     frame_x=None, frame_y=None, frame_zoom=None)


def count_rows(table, condition=None):
    where = f" WHERE {condition}" if condition else ""
    return f"(SELECT COUNT(*) FROM {table}{where})"


SEED_STATUS = (
    (count_rows("owners"), OWNER_COUNT),
    (count_rows("cats"), CAT_COUNT),
    (count_rows("vets"), VET_COUNT),
    (count_rows("stays", "cancelled_at IS NULL AND movement_status = 'CHECKED_OUT'"), STAY_COUNTS["completed"]),
    (count_rows("stays", "cancelled_at IS NULL AND movement_status = 'CHECKED_IN'"), STAY_COUNTS["checked-in"]),
    (count_rows("stays", "cancelled_at IS NULL AND movement_status = 'RESERVED'"), STAY_COUNTS["upcoming"]),
    (count_rows("stays", "cancelled_at IS NOT NULL"), STAY_COUNTS["cancelled"]),
    (count_rows("stay_payments"), PAYMENT_COUNT),
    (count_rows("cat_intake_reviews", "approved_at IS NULL AND dismissed_at IS NULL"), PENDING_INTAKE_COUNT),
    (count_rows("cat_intake_reviews", "approved_at IS NOT NULL OR dismissed_at IS NOT NULL"),
     INTAKE_COUNT - PENDING_INTAKE_COUNT),
    (count_rows("cat_profile_options", "category = 'breed' AND active"), 40),
    (count_rows("food_brands", "active"), 20),
    (count_rows("food_varieties", "active"), 100),
    (count_rows("cat_profile_options", "category = 'litterDetail' AND active"), 18),
    (count_rows("cat_profile_options", "category = 'lastInternalDewormerName' AND active"), 12),
    (count_rows("cat_profile_options", "category = 'lastExternalDewormerName' AND active"), 12),
    (count_rows("cat_photos"), PORTRAIT_COUNT),
    (count_rows("cat_informational_photos"), GALLERY_COUNT),
)

SEED_STATUS_QUERY = "SELECT\n    " + ",\n    ".join(expression for expression, _ in SEED_STATUS) + ";"
SEED_STATUS_COUNTS = tuple(count for _, count in SEED_STATUS)


def generate(today):
    rng = random.Random(44_709)
    rows = FixtureRows()
    photos = load_photos()
    options, brands, varieties = catalog(rows)
    owners = add_households(rows, today, rng, options, brands, varieties, photos)
    stays = add_stays(rows, today, rng, owners)
    add_payments(rows, today, rng, stays)
    add_intakes(rows, today, owners, options, brands, varieties, photos)
    return rows, photos


def write_fixture(output, today, rows, photos):
    output.write(f"-- CatWorld demo dataset for {today} (America/Argentina/Buenos_Aires).\n")
    output.write("""SET NAMES utf8mb4;
SET SESSION sql_mode = CONCAT_WS(',', NULLIF(@@SESSION.sql_mode, ''), 'NO_BACKSLASH_ESCAPES');
START TRANSACTION;
SET @demo_actor = (SELECT id FROM user_accounts WHERE username = 'demo' AND enabled AND role = 'ADMIN');
CREATE TEMPORARY TABLE require_fresh_demo_schema (
    seedable BOOLEAN NOT NULL,
    CONSTRAINT fresh_demo_schema CHECK (seedable = TRUE)
);
INSERT INTO require_fresh_demo_schema (seedable)
SELECT COALESCE(DATABASE() = 'catworld_demo', FALSE)
    AND @demo_actor IS NOT NULL
    AND EXISTS (SELECT 1 FROM demo_activity WHERE id = 1)
    AND NOT EXISTS (SELECT 1 FROM owners)
    AND NOT EXISTS (SELECT 1 FROM cats)
    AND NOT EXISTS (SELECT 1 FROM vets)
    AND NOT EXISTS (SELECT 1 FROM stays)
    AND NOT EXISTS (SELECT 1 FROM food_brands)
    AND (SELECT COUNT(*) FROM cat_profile_options) = 3;
DROP TEMPORARY TABLE require_fresh_demo_schema;
""")
    for pair in photos:
        for photo in pair:
            output.write(f"SET {sql_value(photo.variable)} = {sql_value(photo.content)};\n")
    for category, amount in NIGHTLY_RATES.items():
        output.write(f"UPDATE nightly_reference_rates SET nightly_rate = {amount} WHERE category = {sql_value(category)};\n")
    output.write(f"UPDATE transfer_rates SET transfer_rate = {TRANSFER_RATE} WHERE id = 1;\n")
    output.write(f"UPDATE litter_rates SET litter_rate_per_kg = {LITTER_RATE} WHERE id = 1;\n")
    rows.write(output)
    output.write("COMMIT;\n")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--date", required=True, type=date.fromisoformat, help="Business date (YYYY-MM-DD)")
    parser.add_argument("--output", type=Path, help="Write UTF-8 SQL to this file (default: stdout)")
    args = parser.parse_args()
    try:
        rows, photos = generate(args.date)
        if args.output is None:
            sys.stdout.reconfigure(encoding="utf-8")
            write_fixture(sys.stdout, args.date, rows, photos)
        else:
            with args.output.open("w", encoding="utf-8", newline="\n") as output:
                write_fixture(output, args.date, rows, photos)
    except (OSError, SeedError, ValueError, OverflowError) as error:
        print(f"Demo seed failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
