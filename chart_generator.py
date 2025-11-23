import matplotlib.pyplot as plt
import pandas as pd

def create_bar_chart(df, x_column, y_column, title, output_filename="bar_chart.png"):
    """
    Creates a bar chart from a pandas DataFrame and saves it as a file.

    :param df: pandas DataFrame containing the data.
    :param x_column: The name of the column to use for the x-axis.
    :param y_column: The name of the column to use for the y-axis.
    :param title: The title of the chart.
    :param output_filename: The name of the file to save the chart to.
    """
    if not isinstance(df, pd.DataFrame):
        print("Error: Input data must be a pandas DataFrame.")
        return

    if x_column not in df.columns or y_column not in df.columns:
        print(f"Error: Columns '{x_column}' or '{y_column}' not found in DataFrame.")
        print(f"Available columns: {list(df.columns)}")
        return

    plt.figure(figsize=(10, 6))
    plt.bar(df[x_column], df[y_column])
    plt.xlabel(x_column)
    plt.ylabel(y_column)
    plt.title(title)
    plt.xticks(rotation=45, ha='right')
    plt.tight_layout()

    try:
        plt.savefig(output_filename)
        print(f"Chart saved as '{output_filename}'")
    except Exception as e:
        print(f"Error saving chart: {e}")

    plt.close()

if __name__ == '__main__':
    # This is an example of how to use the function.
    
    # Create a sample DataFrame
    sample_data = {
        'Month': ['January', 'February', 'March', 'April', 'May'],
        'Sales': [150, 200, 180, 220, 240]
    }
    sample_df = pd.DataFrame(sample_data)

    print("Creating an example bar chart with sample data.")
    create_bar_chart(sample_df, 'Month', 'Sales', 'Monthly Sales')

