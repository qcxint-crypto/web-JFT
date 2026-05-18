import subprocess
import logging
import os
import shutil
import tempfile
from datetime import datetime
from pathlib import Path
from urllib.parse import quote
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
WEBSITE_DIR = BASE_DIR / "website"

load_dotenv(BASE_DIR / ".env")

class GitHelper:
    REMOTE_NAME = "origin"
    LOCAL_COMMIT_PATHS = ("website",)
    PUBLISH_IGNORE_PATTERNS = (
        ".git",
        "node_modules",
        ".next",
        ".next-dev",
        ".next-build",
        "out",
        ".vercel",
        "__pycache__",
        ".DS_Store",
        "*.log",
    )

    @staticmethod
    def _run_git(args, check=True, display_args=None, cwd=BASE_DIR):
        result = subprocess.run(
            ["git", *args],
            cwd=cwd,
            capture_output=True,
            text=True
        )

        if check and result.returncode != 0:
            stderr = (result.stderr or result.stdout or "").strip()
            command = "git " + " ".join(display_args or args)
            raise RuntimeError(f"{command} failed: {stderr}")

        return result

    @staticmethod
    def _get_existing_remote_url():
        result = GitHelper._run_git(
            ["remote", "get-url", GitHelper.REMOTE_NAME],
            check=False
        )
        if result.returncode != 0:
            return ""
        return result.stdout.strip()

    @staticmethod
    def _normalize_repo_url(repo_url):
        repo_url = (repo_url or "").strip()
        if not repo_url:
            return ""

        if repo_url.startswith("git@github.com:"):
            repo_path = repo_url.split(":", 1)[1]
            return f"https://github.com/{repo_path}"

        if repo_url.startswith("github.com/"):
            return f"https://{repo_url}"

        if "://" not in repo_url and repo_url.count("/") == 1 and not repo_url.startswith(("/", ".", "~")):
            return f"https://github.com/{repo_url}.git"

        return repo_url

    @staticmethod
    def _extract_github_repo_path(repo_url):
        repo_url = (repo_url or "").strip()
        if repo_url.startswith("git@github.com:"):
            repo_path = repo_url.split(":", 1)[1]
        elif "github.com/" in repo_url:
            repo_path = repo_url.split("github.com/", 1)[1]
        else:
            return ""

        if repo_path.endswith(".git"):
            repo_path = repo_path[:-4]
        return repo_path.strip("/")

    @staticmethod
    def _repo_urls_match(left_url, right_url):
        left_path = GitHelper._extract_github_repo_path(left_url)
        right_path = GitHelper._extract_github_repo_path(right_url)

        if left_path and right_path:
            return left_path == right_path

        return left_url.rstrip("/") == right_url.rstrip("/")

    @staticmethod
    def _ensure_remote():
        repo_url = GitHelper._normalize_repo_url(os.getenv("GITHUB_REPO_URL"))
        current_remote = GitHelper._get_existing_remote_url()

        if current_remote and repo_url:
            if not GitHelper._repo_urls_match(current_remote, repo_url):
                logging.info("Updating git remote origin from GITHUB_REPO_URL.")
                GitHelper._run_git(["remote", "set-url", GitHelper.REMOTE_NAME, repo_url])
                return repo_url
            return current_remote

        if current_remote:
            return current_remote

        if not repo_url:
            raise RuntimeError("Remote git belum ada dan GITHUB_REPO_URL belum diisi di file .env.")

        logging.info("Adding git remote origin from GITHUB_REPO_URL.")
        GitHelper._run_git(["remote", "add", GitHelper.REMOTE_NAME, repo_url])
        return repo_url

    @staticmethod
    def _get_current_branch():
        env_branch = (os.getenv("GITHUB_BRANCH") or "").strip()
        if env_branch:
            return env_branch

        result = GitHelper._run_git(["symbolic-ref", "--quiet", "--short", "HEAD"], check=False)
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()

        return "main"

    @staticmethod
    def _build_push_target(remote_url):
        github_token = (os.getenv("GITHUB_TOKEN") or "").strip()
        repo_path = GitHelper._extract_github_repo_path(remote_url)

        if github_token and repo_path:
            encoded_token = quote(github_token, safe="")
            return f"https://x-access-token:{encoded_token}@github.com/{repo_path}.git"

        return GitHelper.REMOTE_NAME

    @staticmethod
    def _get_git_identity():
        name_result = GitHelper._run_git(["config", "--get", "user.name"], check=False)
        email_result = GitHelper._run_git(["config", "--get", "user.email"], check=False)

        name = (name_result.stdout or "").strip() or "QCXINT Bot"
        email = (email_result.stdout or "").strip() or "bot@localhost"
        return name, email

    @staticmethod
    def _copy_publish_snapshot(snapshot_dir):
        if not WEBSITE_DIR.exists():
            raise RuntimeError("Folder website tidak ditemukan, snapshot deploy tidak bisa dibuat.")

        snapshot_dir = Path(snapshot_dir)
        website_target = snapshot_dir / "website"
        shutil.copytree(
            WEBSITE_DIR,
            website_target,
            ignore=shutil.ignore_patterns(*GitHelper.PUBLISH_IGNORE_PATTERNS),
        )

        metadata_files = (
            (WEBSITE_DIR / "README.md", snapshot_dir / "README.md"),
            (WEBSITE_DIR / "LICENSE", snapshot_dir / "LICENSE"),
            (WEBSITE_DIR / ".gitignore", snapshot_dir / ".gitignore"),
        )
        for source, destination in metadata_files:
            if source.exists():
                shutil.copy2(source, destination)

    @staticmethod
    def _push_website_snapshot(push_target, branch):
        with tempfile.TemporaryDirectory(prefix="website-publish-") as temp_dir:
            snapshot_dir = Path(temp_dir)
            GitHelper._copy_publish_snapshot(snapshot_dir)

            author_name, author_email = GitHelper._get_git_identity()
            GitHelper._run_git(["init", "-b", "publish"], cwd=snapshot_dir)
            GitHelper._run_git(["config", "user.name", author_name], cwd=snapshot_dir)
            GitHelper._run_git(["config", "user.email", author_email], cwd=snapshot_dir)
            GitHelper._run_git(["add", "-A"], cwd=snapshot_dir)
            GitHelper._run_git(
                ["commit", "-m", f"Website snapshot {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"],
                cwd=snapshot_dir,
            )
            GitHelper._run_git(
                ["push", "--force", push_target, f"HEAD:refs/heads/{branch}"],
                cwd=snapshot_dir,
                display_args=["push", "--force", "<website-publish>", f"refs/heads/{branch}"]
                if push_target != GitHelper.REMOTE_NAME
                else ["push", "--force", GitHelper.REMOTE_NAME, f"HEAD:refs/heads/{branch}"]
            )

    @staticmethod
    def commit_and_push():
        try:
            logging.info("Starting Auto Git Commit & Push...")

            # Commit only website assets locally. The GitHub repository is always
            # published from a website-only snapshot afterwards.
            for folder in GitHelper.LOCAL_COMMIT_PATHS:
                if (BASE_DIR / folder).exists():
                    GitHelper._run_git(["add", "-A", folder])

            staged_changes = GitHelper._run_git(["diff", "--cached", "--quiet"], check=False)
            if staged_changes.returncode != 0:
                commit_message = f"Auto-update website snapshot: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                GitHelper._run_git(["commit", "-m", commit_message])
            else:
                logging.info("No new local website changes to commit. Continuing with website snapshot push.")

            remote_url = GitHelper._ensure_remote()
            push_target = GitHelper._build_push_target(remote_url)
            branch = GitHelper._get_current_branch()

            logging.info("Force-pushing website-only snapshot to GitHub branch.")
            GitHelper._push_website_snapshot(push_target, branch)
            logging.info("Website snapshot push successful.")
            return True
        except Exception as e:
            logging.error(f"Git sync failed: {e}")
            return False
