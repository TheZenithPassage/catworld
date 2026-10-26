"""Pure validation of release names as full refs/tags/<name> Git references."""


def valid_release_tag(tag):
    # Match git check-ref-format's full-ref rules, not its stricter --branch
    # shorthand. Keep offline production preflight independent of Git/checkout.
    if not isinstance(tag, str) or not tag or tag.endswith('.'):
        return False
    if '..' in tag or '@{' in tag:
        return False
    if any(ord(character) <= 32 or ord(character) == 127 or
           character in '~^:?*[\\' for character in tag):
        return False
    return all(component and not component.startswith('.') and
               not component.endswith('.lock') for component in tag.split('/'))
