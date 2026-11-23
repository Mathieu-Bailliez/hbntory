from functools import wraps

from flask import abort, g, redirect, session, url_for

from models import User, db


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect(url_for("login"))
        return view(*args, **kwargs)
    return wrapped


def _load_current_user():
    user_id = session.get("user_id")
    if user_id is None:
        return None
    user = db.session.get(User, user_id)
    if user is None or user.is_deleted:
        session.clear()
        return None
    return user


def admin_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        user = _load_current_user()
        if user is None:
            return redirect(url_for("login"))
        if not user.is_admin:
            abort(403)
        g.user = user
        return view(*args, **kwargs)
    return wrapped


def common_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        user = _load_current_user()
        if user is None:
            return redirect(url_for("login"))
        if user.is_admin:
            abort(403)
        g.user = user
        return view(*args, **kwargs)
    return wrapped
