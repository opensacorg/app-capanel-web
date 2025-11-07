Run the application
=========================
Make sure to change directory to the corresponding folder that you want to run.

FastAPI server
---------------------------------------

.. code-block:: bash

   uv sync --all-groups
   fastapi run dev

Or you can run

.. code-block:: bash

   uvicorn app.main:app --reload


React frontend
---------------------------------------

.. code-block:: bash

   npm i
   npm run dev

Once you run the server, you can view these links.

- http://127.0.0.1:8000/redoc
- http://127.0.0.1:8000/docs
- http://127.0.0.1:5173
