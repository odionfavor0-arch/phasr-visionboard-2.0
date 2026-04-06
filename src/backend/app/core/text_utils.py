from __future__ import annotations


def chunk_text(text: str, max_chars: int = 500) -> list[str]:
    clean = " ".join(str(text or "").split())
    if not clean:
        return []

    paragraphs = [part.strip() for part in clean.split(". ") if part.strip()]
    chunks: list[str] = []
    current = ""

    for paragraph in paragraphs:
        sentence = paragraph if paragraph.endswith(".") else f"{paragraph}."
        candidate = f"{current} {sentence}".strip() if current else sentence
        if len(candidate) <= max_chars:
            current = candidate
            continue
        if current:
            chunks.append(current)
        if len(sentence) <= max_chars:
            current = sentence
            continue

        words = sentence.split()
        current = ""
        for word in words:
            candidate = f"{current} {word}".strip() if current else word
            if len(candidate) <= max_chars:
                current = candidate
            else:
                if current:
                    chunks.append(current)
                current = word

    if current:
        chunks.append(current)

    return chunks

