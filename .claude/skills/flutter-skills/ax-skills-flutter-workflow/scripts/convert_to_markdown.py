#!/usr/bin/env python3
import argparse
from pathlib import Path


def convert_txt_or_md(src: Path) -> str:
    return src.read_text(encoding="utf-8", errors="ignore")


def convert_docx(src: Path) -> str:
    try:
        from docx import Document  # type: ignore
    except Exception as exc:
        raise RuntimeError(
            "DOCX support requires python-docx. Install with: pip install python-docx"
        ) from exc
    doc = Document(str(src))
    lines = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n\n".join(lines)


def convert_pdf(src: Path) -> str:
    try:
        from pypdf import PdfReader  # type: ignore
    except Exception as exc:
        raise RuntimeError(
            "PDF support requires pypdf. Install with: pip install pypdf"
        ) from exc
    reader = PdfReader(str(src))
    pages = []
    for i, page in enumerate(reader.pages, start=1):
        pages.append(f"## Page {i}\n\n{page.extract_text() or ''}".strip())
    return "\n\n".join(pages)


def convert_to_markdown(src: Path) -> str:
    suffix = src.suffix.lower()
    if suffix in {".md", ".txt"}:
        return convert_txt_or_md(src)
    if suffix == ".docx":
        return convert_docx(src)
    if suffix == ".pdf":
        return convert_pdf(src)
    raise RuntimeError(f"Unsupported file extension: {suffix}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert requirement docs to markdown.")
    parser.add_argument("--input", required=True, help="Input file path.")
    parser.add_argument("--output", required=True, help="Output directory path.")
    args = parser.parse_args()

    src = Path(args.input).expanduser().resolve()
    out_dir = Path(args.output).expanduser().resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    if not src.exists():
        raise RuntimeError(f"Input file not found: {src}")

    markdown_text = convert_to_markdown(src)
    out_file = out_dir / f"{src.stem}.md"
    out_file.write_text(markdown_text, encoding="utf-8")
    print(str(out_file))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
