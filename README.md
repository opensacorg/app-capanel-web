# The California Accountability Panel web application

California Accountability Panel is a dashboard for viewing school standards. Contributions are welcome!

> [!NOTE]
> Learn about the project on the documentation website [capanel.readthedocs.io](https://app-capanel-web.readthedocs.io).

## Overview

1. Search for a school or school district.
2. Explore test scores and standards.
3. Get detailed breakdowns.

## Contribute

The easist way to get started is to use the [Docker](https://www.docker.com/) container. If you want to contribute to the project, it is recommended to install the Python and Node.js requirements and run each part (frontend, backend, strapi) seperately. For help, see the [developer documentation](https://app-capanel-web.readthedocs.io/en/latest/developer/).

For support and to keep updated on news:

- Attend a virtual [Community Hack Night](https://www.meetup.com/opensacorg).
- Join our [Slack channel (updated 2026-02-01)](https://join.slack.com/t/opensacorg/shared_invite/zt-3orx8kjdj-8gULmv2wuTHhAUxUt9SY8A).
- Email us at info@opensac.org or info@innovateforcalifornia.org.

## Self-hosting with Docker

All parts of the application can be started by running `docker compose up`. **Before the first run**, make sure to update the configs in the `.env` files to customize your configurations. For help, see [deployment documentation](https://app-capanel-web.readthedocs.io/en/latest/developer/).

The minimum required environment variables are:

```env
SECRET_KEY=changethis
FIRST_SUPERUSER_PASSWORD=changethis
POSTGRES_PASSWORD=changethis
```

View [all environment variables](https://app-capanel-web.readthedocs.io/en/latest/developer/#environment-variables).

### Generate Secret Keys

Some environment variables in the `.env` file have a default value of `changethis`.

You have to change them with a secret key, to generate secret keys you can run the following command:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the content and use that as password / secret key. And run that again to generate another secure key.

### Cloud hosting providers

We are currently working on support for Google Cloud Run.

## Security

We strive to make this application secure. Some highlights include:

- Hashed passwords
- Based on an actively mantained open-source project (full-stack-fastapi-postgres)

### Security concerns

The application does not enforce https by default. You can enable it by setting `SECURE_SSL_REDIRECT` to `True` in the `.env` file.

See [Security.md](Security.md) for more information on reporting security vulnerabilities. For other security related topics see the [security documentation page](https://app-capanel-web.readthedocs.io/en/latest/security/).

# Other resources

- [Documentation repository](https://github.com/nwb-capanel-web/docs)
